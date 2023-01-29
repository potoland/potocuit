import type {
	ApplicationCommandInteraction, AutocompleteInteraction
} from './structures/interaction';
import type {
	Adapter, CachedEvents
} from '@potoland/cache';
import type {
	Command
} from './utils/command';
import type {
	RestAdapter
} from '@biscuitland/rest';
import type {
	Shard
} from '@biscuitland/ws';

import {
	DefaultRestAdapter,
} from '@biscuitland/rest';
import {
	ShardManager
} from '@biscuitland/ws';
import {
	Cache
} from '@potoland/cache';
import {
	Interaction,
} from './structures/interaction';
import {
	OptionsContext
} from './utils/command';
import {
	ApplicationCommandTypes, APPLICATION_COMMANDS,
	GUILD_APPLICATION_COMMANDS, InteractionTypes
} from '@biscuitland/api-types';

export class Potocuit {
	public readonly ws: ShardManager;
	public readonly rest: RestAdapter;
	public readonly cache: Cache;
	public readonly commands = new Map<string, Map<string, Command>>();
	public events = {
		interactionCreate: (_data: Interaction): any => { return; },
		ready: (_shards: [number, number]): any => { return; },
		listenerError: (_event: string, _error: unknown): any => { return; }
	};

	constructor(options: PotocuitOptions) {
		const onPacket = this.__onPacket.bind(this);
		this.ws = 'shardManager' in options ? options.shardManager : new ShardManager({
			...options.shardManagerOptions,
			config: {
				token: options.token,
				intents: options.intents,
			},
			async handleDiscordPayload(shard, payload) {
				await onPacket(shard, payload);
			},
		});
		if ('shardManager' in options) {
			const fn = options.shardManager.options.handleDiscordPayload;
			options.shardManager.options.handleDiscordPayload = async (shard, payload) => {
				await onPacket(shard, payload);
				return fn(shard, payload);
			};
		}
		this.rest = 'restAdapter' in options ? options.restAdapter : new DefaultRestAdapter({
			token: 'token' in options ? options.token : options.shardManager.options.config.token,
			...DefaultRestAdapter.DEFAULTS,
			...options.restAdapterOptions,
		});
		this.cache = new Cache(options.cache.adapter, options.cache.disabledEvents);

		// Object.defineProperties(this, {
		// 	rest: {
		// 		value: rest,
		// 	},
		// 	ws: {
		// 		value: ws,
		// 	},
		// 	cache: {
		// 		value: cache,
		// 	}
		// });
	}

	private async __onPacket(shard: Shard, payload: any) {
		await this.cache.onPacket(shard, payload);
		switch (payload.t) {
			case 'READY':
				try {
					await this.events.ready(payload.d.shard ?? [0, 0]);
				} catch (e) {
					await this.events.listenerError(payload.t, e);
				}
				break;
			case 'INTERACTION_CREATE':
				switch (payload.d.type) {
					case InteractionTypes.MessageComponent: {
						const interaction = new Interaction(payload.d, [], this);
						try {
							await this.events.interactionCreate(interaction);
						} catch (e) {
							await this.events.listenerError(payload.t, e);
						}
						break;
					}
					case InteractionTypes.ModalSubmit: {
						const interaction = new Interaction(payload.d, [], this);
						try {
							await this.events.interactionCreate(interaction);
						} catch (e) {
							await this.events.listenerError(payload.t, e);
						}
						break;
					}
					case InteractionTypes.ApplicationCommand: {
						switch (payload.d.data.type) {
							case ApplicationCommandTypes.ChatInput: {
								const command = this.commands.get(payload.d.guild_id ?? '@me')?.get(payload.d.data.name);
								if (!command) { return; }
								const { invoker, options } = command.getInvoker(payload.d.data);
								const interaction = new Interaction(payload.d, options, this) as ApplicationCommandInteraction;
								const optionsContext = new OptionsContext(payload.d, options);
								try {
									await invoker?.run(interaction, optionsContext);
								} catch (e) {
									await invoker?.onError(interaction, optionsContext, e);
								}
								try {
									await this.events.interactionCreate(interaction);
								} catch (e) {
									await this.events.listenerError(payload.t, e);
								}
							} break;
						}
						break;
					}
					case InteractionTypes.ApplicationCommandAutocomplete: {
						const command = this.commands.get(payload.d.guild_id ?? '@me')?.get(payload.d.data.name);
						if (!command) { return; }
						const { invoker, options } = command.getInvoker(payload.d.data);
						const interaction = new Interaction(payload.d, options, this) as AutocompleteInteraction;
						const optionsContext = new OptionsContext(payload.d, options);
						try {
							await invoker?.onAutocomplete(interaction, options.find(x => x.focused)!, optionsContext);
						} catch (e) {
							await invoker?.onError(interaction, optionsContext, e);
						}
						try {
							await this.events.interactionCreate(interaction);
						} catch (e) {
							await this.events.listenerError(payload.t, e);
						}
					} break;
				}
				break;
		}
	}

	public async start() {
		await this.ws.spawns();
	}

	public updateLocalCommands(commands: Command[]) {
		for (const i of commands) {
			if (!this.commands.has(i.guild_id ?? '@me')) {
				this.commands.set(i.guild_id ?? '@me', new Map());
			}
			this.commands.get(i.guild_id ?? '@me')!.set(i.name, i);
		}
	}

	public async publishApplicationCommands(commands: Command[], __botId?: string) {
		const botId = __botId ?? Potocuit.getBotIdFromToken(this.ws.options.config.token);

		this.updateLocalCommands(commands);

		for (const [guildId, cmds] of this.commands) {
			if (guildId === '@me') {
				await this.rest.put(APPLICATION_COMMANDS(
					botId
				), Array.from(cmds.values()));
			} else {
				await this.rest.put(GUILD_APPLICATION_COMMANDS(
					botId, guildId
				), Array.from(cmds.values()));
			}
		}
	}

	public static getBotIdFromToken(token: string): string {
		return Buffer.from(token.split('.')[0], 'base64').toString();
	}
}

type BasePotocuitOptions = {
	cache: {
		adapter: Adapter;
		disabledEvents: CachedEvents[];
	};
};

export type PotocuitOptions = BasePotocuitOptions & ({
	shardManagerOptions: Omit<ConstructorParameters<typeof ShardManager>[0], 'config' | 'handleDiscordPayload'>;
	intents: number;
	token: string;
} | {
	shardManager: ShardManager;
}) & ({
	restAdapterOptions?: Omit<ConstructorParameters<typeof DefaultRestAdapter>[0], 'token'>;
} | {
	restAdapter: RestAdapter;
});
