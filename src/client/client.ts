import { type GatewayDispatchPayload } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Adapter } from '../cache';
import type { StartOptions } from './base';
import type { DeepPartial } from '../structures/extra/types';
import { ShardManager } from '../websocket';
import { PotoEventHandler } from '../events/handler';
import { BaseClient } from './base';
import { onInteraction } from './oninteraction';

export class PotoClient extends BaseClient {
	gateway!: ShardManager;
	events = new PotoEventHandler(this.logger);

	setServices({ gateway, rest, cache }: { rest?: BiscuitREST; gateway?: ShardManager; cache?: Adapter }) {
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


	async loadEvents(dir?: string) {
		dir ??= await this.getRC().then(x => x.events);
		if (dir) {
			await this.events.load(dir);
			this.logger.info('PotoEventHandler loaded');
		}
	}

	protected async execute(options: { token?: string; intents?: number } = {}) {
		await super.execute(options);
		await this.gateway.spawnShards();
	}

	async start(options: Omit<DeepPartial<StartOptions>, 'httpConnection'> = {}) {
		await super.start(options);
		await this.loadEvents(options.eventsDir);

		const { token: tokenRC, intents: intentsRC } = await this.getRC();
		const token = options?.token ?? tokenRC;
		const intents = options?.connection?.intents ?? intentsRC;

		if (!this.gateway) {
			BaseClient.assertString(token, 'token is not a string');
			this.gateway = new ShardManager({
				token,
				info: await this.proxy.gateway.bot.get(),
				intents,
				handlePayload: (shardId, packet) => {
					return this.onPacket(shardId, packet);
				},
			});
		}

		this.cache.intents = this.gateway.options.intents;

		await this.execute(options.connection);
	}

	protected async onPacket(shardId: number, packet: GatewayDispatchPayload) {
		await this.cache.onPacket(packet);
		await this.events.execute(packet.t, packet, this, shardId);
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
