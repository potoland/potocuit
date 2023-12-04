import type { CamelCase, GatewayDispatchEvents } from '@biscuitland/common';
import { type GatewayDispatchPayload, ReplaceRegex } from '@biscuitland/common';
import { BiscuitREST } from '@biscuitland/rest';
import { GatewayManager } from '@biscuitland/ws';
import { Cache, DefaultMemoryAdapter } from '../cache';
import { PotoEventHandler } from '../events/handler';
import * as RawEvents from '../events/hooks/index';
import type { StartOptions } from './base';
import { BaseClient } from './base';
import { onInteraction } from './oninteraction';
import type { DeepPartial } from '../structures/extra/types';

export class PotoClient extends BaseClient {
	gateway!: GatewayManager;
	events = new PotoEventHandler(this.logger);

	setServices({ gateway, rest, cache }: { rest?: BiscuitREST; gateway?: GatewayManager; cache?: Cache }) {
		super.setServices({ rest, cache });
		if (gateway) {
			const onPacket = this.onPacket.bind(this);
			const oldFn = gateway.options.handlePayload;
			gateway.options.handlePayload = async (shardId, packet) => {
				await onPacket(shardId, packet);
				return oldFn(shardId, packet);
			};
			this.gateway = gateway;
		}
	}

	async execute(options?: { token?: string; intents?: number }) {
		super.execute();
		const { token: tokenRC, intents: intentsRC } = await this.getRC();

		const token = options?.token ?? tokenRC;
		const intents = options?.intents ?? intentsRC;

		if (!this.rest) {
			BaseClient.assertString(token);
			this.rest = new BiscuitREST({
				token
			});
		}

		if (!this.gateway) {
			BaseClient.assertString(token);
			this.gateway = new GatewayManager({
				token,
				info: await this.proxy.gateway.bot.get(),
				intents,
				handlePayload: (shardId, packet) => {
					return this.onPacket(shardId, packet);
				},
			});
		}

		this.cache ??= new Cache(this.gateway.options.intents, this.rest, new DefaultMemoryAdapter());

		await this.gateway.spawnShards();
	}

	async loadEvents(dir?: string) {
		dir ??= await this.getRC().then(x => x.events);
		BaseClient.assertString(dir);
		await this.events.load(dir);
		this.logger.info('PotoEventHandler loaded');
	}

	async start(options: Omit<DeepPartial<StartOptions>, 'httpConnection'> = {}) {
		await super.start(options);
		await this.loadEvents(options.eventsDir);
		await this.execute(options.connection);
	}

	protected async onPacket(shardId: number, packet: GatewayDispatchPayload) {
		await this.cache.onPacket(packet);
		const eventName = ReplaceRegex.camel(packet.t?.toLowerCase() ?? '') as CamelCase<typeof GatewayDispatchEvents[keyof typeof GatewayDispatchEvents]>;
		await this.events.execute(eventName, RawEvents[packet.t]?.(this, packet.d as never), this, shardId);
		switch (packet.t) {
			case 'READY':
				this.botId = packet.d.user.id;
				this.applicationId = packet.d.application.id;
				this.debugger.debug(`[${packet.d.user.username}](${this.botId}) is online...`);
				break;
			case 'INTERACTION_CREATE': {
				await onInteraction(packet.d, this);
				break;
			}
		}
	}
}

// switch (packet.d.type) {
// 	case InteractionType.ApplicationCommandAutocomplete: {
// 		const packetData = packet.d.data;
// 		const parentCommand = this.commandHandler.commands.find(x => x.name === packetData.name)!;
// 		const optionsResolver = new OptionResolver(this.rest, this.cache, packetData.options ?? [], parentCommand, packet.d.data.guild_id, packet.d.data.resolved);
// 		const interaction = new AutocompleteInteraction(this.rest, this.cache, packet.d);
// 		const command = optionsResolver.getAutocomplete();
// 		if (command?.autocomplete) {
// 			await command.autocomplete(interaction);
// 		}
// 	} break;
// 	case InteractionType.ApplicationCommand: {
// 		switch (packet.d.data.type) {
// 			case ApplicationCommandType.ChatInput: {
// 				const packetData = packet.d.data;
// 				const parentCommand = this.commandHandler.commands.find(x => x.name === (packetData).name)!;
// 				const optionsResolver = new OptionResolver(this.rest, this.cache, packetData.options ?? [], parentCommand, packet.d.data.guild_id, packet.d.data.resolved);
// 				const interaction = BaseInteraction.from(this.rest, this.cache, packet.d) as ChatInputCommandInteraction;
// 				const command = optionsResolver.getCommand();
// 				if (command?.run) {
// 					const context = new CommandContext(this, interaction, {}, {}, optionsResolver);
// 					const [erroredOptions, result] = await command.runOptions(context, optionsResolver);
// 					if (erroredOptions) { return await command.onRunOptionsError(context, result); }

// 					const [_, erroredMiddlewares] = await command.runMiddlewares(context);
// 					if (erroredMiddlewares) { return command.onStop(context, erroredMiddlewares); }

// 					await command.run(context);
// 				}
// 			} break;
// 		} break;
// 	}
// } break;
