import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	InteractionType,
	ReplaceRegex,
	Logger
} from '@biscuitland/common';
import { BiscuitREST, Router } from '@biscuitland/rest';
import { GatewayManager } from '@biscuitland/ws';
import { readdir } from 'fs/promises';

import { join } from 'path';
import * as RawEvents from './events';

import type {
	APIApplicationCommand,
	APIApplicationCommandAutocompleteInteraction,
	APIApplicationCommandBasicOption,
	APIApplicationCommandInteractionDataBasicOption,
	APIApplicationCommandInteractionDataOption,
	APIApplicationCommandInteractionDataSubcommandOption,
	APIApplicationCommandSubcommandGroupOption,
	APIApplicationCommandSubcommandOption,
	APIChatInputApplicationCommandInteraction,
	APIChatInputApplicationCommandInteractionData,
	CamelCase,
	GatewayDispatchPayload,
	LoggerOptions
} from '@biscuitland/common';
import type { CreateGatewayManagerOptions, GatewayEvents } from '@biscuitland/ws';
import type { Adapter, CachedEvents } from '@potoland/structures';
import { ChatInputInteraction, AutocompleteInteraction, Cache, DefaultMemoryAdapter } from '@potoland/structures';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export class Potocuit {
	commands = new Map<string, Command>();
	gateway!: GatewayManager;
	rest: BiscuitREST;
	cache: Cache;
	events: Partial<{
		[E in keyof typeof RawEvents as CamelCase<E>]: (arg: ReturnType<typeof RawEvents[E]>) => any
	}>;

	private logger: Logger;

	constructor(readonly token: string, options: {
		rest?: BiscuitREST;
		gateway?: GatewayManager;
		cache?: {
			adapter?: Adapter;
			disabledEvents?: CachedEvents[];
		};
		events?: Partial<{
			[E in keyof typeof RawEvents as CamelCase<E>]: (arg: ReturnType<typeof RawEvents[E]>) => any
		}>;
		logger?: Logger | LoggerOptions;
	} = {}) {
		const onPayload = this.onPayload.bind(this);
		this.events = options.events ?? {};
		this.rest = options.rest ? options.rest : new BiscuitREST({
			token,
		});
		const cache = new Cache(
			this.rest,
			options.cache?.adapter ?? new DefaultMemoryAdapter(),
			options.cache?.disabledEvents ?? [],
		);
		this.cache = cache;
		if (options.gateway) {
			const handlePayload = options.gateway.options.handlePayload;
			options.gateway.options.handlePayload = async (...[shardId, data]: Parameters<CreateGatewayManagerOptions['handlePayload']>) => {
				await cache.onPacket(data as GatewayDispatchPayload);
				onPayload(data as GatewayDispatchPayload);
				await handlePayload(shardId, data);
			};
			this.gateway = options.gateway;
		}
		this.logger = options.logger instanceof Logger ? options.logger : new Logger(options.logger ?? {});
	}

	get api() {
		const rest = this.rest;
		return Router.prototype.createProxy.call({
			rest,
			noop: () => {
				return;
			},
			createProxy(route?: string[]) {
				return Router.prototype.createProxy.call({ ...this, rest }, route);
			},
		});
	}

	async start(
		options?: Omit<
			PartialBy<CreateGatewayManagerOptions, 'handlePayload'>,
			'token'
		>,
	) {
		const cache = this.cache;
		const onPayload = this.onPayload.bind(this);
		if (!this.gateway && options) {
			this.gateway = new GatewayManager({
				...options,
				token: this.token,
				async handlePayload(shardId, data) {
					await cache.onPacket(
						data as unknown as GatewayDispatchPayload,
					);
					onPayload(data as unknown as GatewayDispatchPayload);
					if (options.handlePayload) {
						await options.handlePayload(shardId, data);
					}
				},
			});
		}
		if (!this.gateway) {
			throw new Error('No "gateway" instance');
		}

		await this.gateway.spawnShards();
	}

	async loadCommands(fullPath: string) {
		const result: Command[] = [];

		for (const i of await readdir(fullPath, { withFileTypes: true })) {
			if (i.isDirectory()) {
				const folder = new Command(join(fullPath, i.name), (await import(`file:///${join(fullPath, i.name, '_parent.js')}`)).data);
				await folder.read();
				result.push(folder);
			} else {
				const rawCommand = await import(`file:///${join(fullPath, i.name)}`);
				const command = rawCommand.default instanceof Command ? rawCommand.default : new Command(join(fullPath, i.name), rawCommand.data, rawCommand.execute.bind(rawCommand), rawCommand.onAutocomplete?.bind(rawCommand));
				result.push(command);
			}
		}

		for (const i of result) {
			this.commands.set(i.data.name, i);
		}

		return result;
	}

	async publishCommands(applicationId: string, commands?: Command[]) {
		return await this.api.applications(applicationId).commands.put({
			body: commands?.map(x => x.toJSON()) || [...this.commands.values()].map(x => x.toJSON()),
		});
	}

	private onPayload(raw: GatewayDispatchPayload) {
		this.logger.debug(`Received ${raw.t ?? 'UNKNOWN'} event XDD`);
		switch (raw.t) {
			case 'INTERACTION_CREATE':
				this.onInteractionCreate(raw.d);
				break;
		}
		const camelCased = ReplaceRegex.snake(raw.t?.toLowerCase() ?? '') as CamelCase<keyof typeof RawEvents>;
		// @ts-expect-error
		this.events[camelCased]?.(RawEvents[raw.t](this.rest, this.cache, raw.d));
	}

	private async onInteractionCreate(interaction: GatewayEvents['INTERACTION_CREATE']) {
		switch (interaction.type) {
			case InteractionType.ApplicationCommand: {
				switch (interaction.data.type) {
					case ApplicationCommandType.ChatInput: {
						const command = this.commands.get(interaction.data.name);
						if (!command) {
							return this.logger.info('No command found', interaction.data.name);
						}
						const { data, invoker } = command.getInvoker(interaction.data);
						if (invoker.execute) {
							const chatinputinteraction = new ChatInputInteraction(this.rest, this.cache, interaction as APIChatInputApplicationCommandInteraction);
							await invoker.execute(chatinputinteraction, data);
						}
						break;
					}
				}
				break;
			}
			case InteractionType.ApplicationCommandAutocomplete: {
				const command = this.commands.get(interaction.data.name);
				if (!command) {
					return this.logger.info('No command found', interaction.data.name);
				}
				const { data, invoker } = command.getInvoker(interaction.data);
				if (invoker.onAutocomplete) {
					const autocompleteinteraction = new AutocompleteInteraction(this.rest, this.cache, interaction as APIApplicationCommandAutocompleteInteraction);
					await invoker.onAutocomplete(autocompleteinteraction, data);
				}
				break;
			}
		}
	}
}

class BaseCommand {
	options: (SubGroupCommand | SubCommand | APIApplicationCommandBasicOption)/*  Command */[] = [];
	guildId: string[] = [];

	constructor(readonly data: { name: string; type: ApplicationCommandOptionType | ApplicationCommandType }) { }

	getInvoker(interaction: APIChatInputApplicationCommandInteractionData | APIApplicationCommandInteractionDataSubcommandOption): {
		invoker: SubCommand | Command;
		data: APIApplicationCommandInteractionDataBasicOption[];
	} {
		if (this.data.type === ApplicationCommandOptionType.SubcommandGroup) {
			return {
				invoker: this.options[0] as SubCommand,
				data: (interaction.options ?? []) as APIApplicationCommandInteractionDataBasicOption[]
			};
		}

		if (!interaction.options?.length) {
			return {
				invoker: this as unknown as Command | SubCommand,
				data: []
			};
		}

		if ([ApplicationCommandOptionType.SubcommandGroup, ApplicationCommandOptionType.Subcommand].includes(interaction.options[0].type)) {
			return this.getInvokerOption(interaction.options[0]);
		}

		throw new Error('Invalid command');
	}

	getInvokerOption(option: APIApplicationCommandInteractionDataOption): {
		invoker: SubCommand | Command;
		data: APIApplicationCommandInteractionDataBasicOption[];
	} {
		if (option.type === ApplicationCommandOptionType.Subcommand) {
			return {
				invoker: this as unknown as Command | SubCommand,
				data: option.options ?? []
			};
		}
		if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
			const subgroup = this.options.find(x => ('name' in x ? x.name : x.data.name) === option.name);
			if (!subgroup || !('getInvoker' in subgroup)) {
				throw new Error('Invalid command');
			}
			return subgroup.getInvoker(option.options[0]);
		}

		throw new Error('Invalid command');
	}
}

export class Command extends BaseCommand {
	// options: (SubGroupCommand | SubCommand | APIApplicationCommandBasicOption)/*  Command */[] = [];

	constructor(
		readonly path: string,
		readonly data: APIApplicationCommand,
		readonly execute?: (interaction: ChatInputInteraction, data: APIApplicationCommandInteractionDataBasicOption[]) => Promise<void>,
		readonly onAutocomplete?: (interaction: unknown, focused: unknown) => Promise<void>
	) {
		super(data);
	}

	async read() {
		const result: SubGroupCommand[] = [];
		for (const i of await readdir(this.path, { withFileTypes: true })) {
			if (i.isDirectory()) {
				const group = new SubGroupCommand(join(this.path, i.name), (await import(`file:///${join(this.path, i.name, '_parent.js')}`)).data);
				await group.read();
				result.push(group);
				this.options.push(group);
			} else {
				if (i.name !== '_parent.js') {
					const rawCommand = await import(`file:///${join(this.path, i.name)}`);
					const cmd = rawCommand.default instanceof SubCommand
						? rawCommand.default
						: new SubCommand(rawCommand.data, rawCommand.execute.bind(rawCommand), rawCommand.onAutocomplete?.bind(rawCommand));
					this.options.push(cmd);
				}
				// console.log(i.name, this.path);
			}
		}
		return result;
	}

	toJSON() {
		return {
			...this.data,
			options: this.options.map(x => 'toJSON' in x ? x.toJSON() : x)
		};
	}
}

export class SubGroupCommand extends BaseCommand {
	options: SubCommand/*  Command */[] = [];
	constructor(
		readonly path: string,
		readonly data: APIApplicationCommandSubcommandGroupOption,

	) {
		super(data);
	}

	read() {
		return Command.prototype.read.call(this);
	}

	toJSON(): APIApplicationCommandSubcommandGroupOption {
		return {
			...this.data,
			options: this.options.map(x => x.toJSON())
		};
	}
}


export class SubCommand extends BaseCommand {
	constructor(
		readonly data: APIApplicationCommandSubcommandOption,
		readonly execute: (interaction: ChatInputInteraction, data: APIApplicationCommandInteractionDataBasicOption[]) => Promise<void>,
		readonly onAutocomplete?: (interaction: unknown, focused: unknown) => Promise<void>
	) {
		super(data);
	}

	toJSON() {
		return this.data;
	}
}
