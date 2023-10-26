import { InteractionType, type APIChatInputApplicationCommandInteractionData, type GatewayDispatchPayload, ApplicationCommandType } from '@biscuitland/common';
import { BiscuitREST, Router } from '@biscuitland/rest';
import { GatewayManager } from '@biscuitland/ws';
import { Cache, DefaultMemoryAdapter } from '../cache';
import { BaseInteraction, ChatInputCommandInteraction } from '../structures/Interaction';
import { CommandContext, throwError } from '..';
import { OptionResolver, PotoCommandHandler } from '../commands/handler';

export class PotoClient {
	gateway!: GatewayManager;
	rest!: BiscuitREST;
	cache!: Cache;
	handler = new PotoCommandHandler;

	get proxy() {
		return new Router(this.rest).createProxy();
	}

	setServices({ gateway, rest, cache }: { rest?: BiscuitREST; gateway?: GatewayManager; cache?: Cache }) {
		if (gateway) {
			const onPacket = this.onPacket.bind(this);
			const oldFn = gateway.options.handlePayload;
			gateway.options.handlePayload = async (shardId, packet) => {
				await onPacket(shardId, packet);
				return oldFn(shardId, packet);
			};
			this.gateway = gateway;
		}
		if (rest) {
			this.rest = rest;
		}
		if (cache) {
			this.cache = cache;
		}
	}

	async execute(token?: string, intents = 0) {
		this.rest ??= (!token && throwError('Token expected')) || new BiscuitREST({
			token: token!
		});

		this.gateway ??= (!token && throwError('Token expected')) || new GatewayManager({
			token: token!,
			info: await this.proxy.gateway.bot.get(),
			intents,
			handlePayload: (shardId, packet) => {
				return this.onPacket(shardId, packet);
			},
		});

		this.cache ??= new Cache(this.gateway.options.intents, this.rest, new DefaultMemoryAdapter());

		await this.gateway.spawnShards();
	}

	async loadCommands(path: string, applicationId: string) {
		await this.proxy.applications(applicationId).commands.put({
			body: Object.values(await this.handler.loadCommands(path))
		});
	}

	protected async onPacket(shardId: number, packet: GatewayDispatchPayload) {
		await this.cache.onPacket(packet);
		switch (packet.t) {
			// deberiamos modular esto
			case 'INTERACTION_CREATE': {
				switch (packet.d.type) {
					case InteractionType.ApplicationCommand: {
						const packetData = packet.d.data as APIChatInputApplicationCommandInteractionData;
						const parentCommand = this.handler.commands.find(x => x.name === (packetData as APIChatInputApplicationCommandInteractionData).name)!;
						const optionsResolver = new OptionResolver(packetData.options ?? [], parentCommand);

						switch (packet.d.data.type) {
							case ApplicationCommandType.ChatInput: {
								const interaction = BaseInteraction.from(this.rest, this.cache, packet.d) as ChatInputCommandInteraction;
								const command = optionsResolver.getCommand();
								if (command?.run) {
									const context = new CommandContext(interaction, optionsResolver, {});
									const [_, error] = await command.runMiddlewares(context);
									if (error) { return command.onStop(context, error); }
									await command.run(context);
								}
								// await interaction.reply({
								// 	type: InteractionResponseType.ChannelMessageWithSource,
								// 	data: {
								// 		content: 'pong desde pootucit'
								// 	}
								// });
							} break;
						} break;
					}
				} break;
			}
		}
		if (packet.t === 'READY') { console.log(`${shardId}`, packet.d.user.username); }
		// else console.log(`${shardId}`, packet.d, packet.t);
	}
}
