import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	InteractionResponseType,
	InteractionType,
} from '@biscuitland/common';
import { BiscuitREST, Router } from '@biscuitland/rest';
import { GatewayManager } from '@biscuitland/ws';
import { Cache, DefaultMemoryAdapter } from '@potoland/cache';
import { readdir } from 'fs/promises';
import { join } from 'path';

import type {
	APIApplicationCommand,
	APIApplicationCommandBasicOption,
	APIApplicationCommandInteractionDataBasicOption,
	APIApplicationCommandInteractionDataOption,
	APIApplicationCommandInteractionDataSubcommandOption,
	APIApplicationCommandSubcommandGroupOption,
	APIApplicationCommandSubcommandOption,
	APIChatInputApplicationCommandInteractionData,
	GatewayDispatchPayload
} from '@biscuitland/common';
import type { CreateGatewayManagerOptions, GatewayEvents } from '@biscuitland/ws';
import type { Adapter, CachedEvents } from '@potoland/cache';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export class Potocuit {
	commands = new Map<string, Command>();
	gateway!: GatewayManager;
	rest: BiscuitREST;
	cache: Cache;

	constructor(readonly token: string, options: {
		rest?: BiscuitREST;
		gateway?: GatewayManager;
		cache?: {
			adapter?: Adapter;
			disabledEvents?: CachedEvents[];
		};
	} = {}) {
		const onPayload = this.onPayload.bind(this);
		const cache = new Cache(
			options.cache?.adapter ?? new DefaultMemoryAdapter(),
			options.cache?.disabledEvents ?? [],
		);
		this.cache = cache;
		this.rest = options.rest ? options.rest : new BiscuitREST({
			token,
		});
		if (options.gateway) {
			const handlePayload = options.gateway.options.handlePayload;
			options.gateway.options.handlePayload = async (shardId: number, data: Parameters<CreateGatewayManagerOptions['handlePayload']>[1]) => {
				await cache.onPacket(data as GatewayDispatchPayload);
				onPayload(data as GatewayDispatchPayload);
				await handlePayload(shardId, data);
			};
			this.gateway = options.gateway;
		}
	}

	get api() {
		return Router.prototype.createProxy.call({
			rest: this.rest,
			noop: () => {
				return;
			},
			createProxy(route?: string[]) {
				return Router.prototype.createProxy.call(this, route);
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
			// console.log(i.name);
			if (i.isDirectory()) {
				const folder = new Command(join(fullPath, i.name), (await import(`file:///${join(fullPath, i.name, '_parent.js')}`)).data);
				await folder.read();
				result.push(folder);
			} else {
				const rawCommand = await import(`file:///${join(fullPath, i.name)}`);
				const command = rawCommand.default instanceof Command ? rawCommand.default : new Command(join(fullPath, i.name), rawCommand.data, rawCommand.execute?.bind(rawCommand), rawCommand.onAutocomplete?.bind(rawCommand));
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
		switch (raw.t) {
			case 'INTERACTION_CREATE':
				this.onInteractionCreate(raw.d);
				break;
		}
	}

	private async onInteractionCreate(interaction: GatewayEvents['INTERACTION_CREATE']) {
		switch (interaction.type) {
			case InteractionType.ApplicationCommand: {
				switch (interaction.data.type) {
					case ApplicationCommandType.ChatInput: {
						const command = this.commands.get(interaction.data.name);
						if (!command) {
							throw new Error('No command found.');
						}
						const { data, invoker } = command.getInvoker(interaction.data);
						if (invoker.execute) {
							const api = this.api;
							const reply = (str: string) => {
								return api.interactions(interaction.id)(interaction.token).callback.post({
									body: {
										type: InteractionResponseType.ChannelMessageWithSource,
										data: {
											content: str ?? 'xd'
										}
									}
								});
							};
							await invoker.execute(reply, data);
						}
						break;
					}
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
		readonly execute?: (...interaction: unknown[]) => Promise<void>,
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
						: new SubCommand(rawCommand.data, rawCommand.execute?.bind(rawCommand), rawCommand.onAutocomplete?.bind(rawCommand));
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
		readonly execute: (...interaction: unknown[]) => Promise<void>,
		readonly onAutocomplete?: (interaction: unknown, focused: unknown) => Promise<void>
	) {
		super(data);
	}

	toJSON() {
		return this.data;
	}
}
