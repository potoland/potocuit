import { parentPort, workerData } from 'node:worker_threads';
import type {
	DeepPartial,
	GatewayDispatchPayload,
	GatewayPresenceUpdateData,
	If,
	WatcherPayload,
	WatcherSendToShard,
} from '../common';
import { EventHandler } from '../events';
import { ClientUser } from '../structures';
import { ShardManager } from '../websocket';
import { MemberUpdateHandler } from '../websocket/discord/memberUpdate';
import type { BaseClientOptions, InternalRuntimeConfig, ServicesOptions, StartOptions } from './base';
import { BaseClient } from './base';
import { onInteraction } from './oninteraction';

export class Client<Ready extends boolean = boolean> extends BaseClient {
	gateway!: ShardManager;
	events = new EventHandler(this.logger);
	me!: If<Ready, ClientUser>;
	declare options: ClientOptions | undefined;
	memberUpdateHandler = new MemberUpdateHandler();

	constructor(options?: ClientOptions) {
		super(options);
	}

	setServices({
		gateway,
		...rest
	}: ServicesOptions & {
		gateway?: ShardManager;
	}) {
		super.setServices(rest);
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
			this.logger.info('EventHandler loaded');
		}
	}

	protected async execute(options: { token?: string; intents?: number } = {}) {
		await super.execute(options);
		if (!workerData?.__USING_WATCHER__) {
			await this.gateway.spawnShards();
		} else {
			parentPort?.on('message', (data: WatcherPayload | WatcherSendToShard) => {
				switch (data.type) {
					case 'PAYLOAD':
						this.gateway.options.handlePayload(data.shardId, data.payload);
						break;
					case 'SEND_TO_SHARD':
						this.gateway.send(data.shardId, data.payload);
						break;
				}
			});
		}
	}

	async start(options: Omit<DeepPartial<StartOptions>, 'httpConnection'> = {}, execute = true) {
		await super.start(options);
		await this.loadEvents(options.eventsDir);

		const { token: tokenRC, intents: intentsRC, debug: debugRC } = await this.getRC<InternalRuntimeConfig>();
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
				presence: this.options?.presence,
				debug: debugRC,
				shardStart: this.options?.shardStart,
				shardEnd: this.options?.shardEnd,
			});
		}

		this.cache.intents = this.gateway.options.intents;

		if (execute) {
			await this.execute(options.connection);
		} else {
			await super.execute(options);
		}
	}

	protected async onPacket(shardId: number, packet: GatewayDispatchPayload) {
		switch (packet.t) {
			//// Cases where we must obtain the old data before updating
			case 'GUILD_MEMBER_UPDATE':
				if (!this.memberUpdateHandler.check(packet.d)) {
					return;
				}
				await this.events.execute(packet.t, packet, this as Client<true>, shardId);
				await this.cache.onPacket(packet);
				break;
			case 'GUILD_DELETE':
			case 'CHANNEL_UPDATE': {
				await this.events.execute(packet.t, packet, this as Client<true>, shardId);
				await this.cache.onPacket(packet);
				break;
			}
			//rest of the events
			default: {
				await this.cache.onPacket(packet);
				switch (packet.t) {
					case 'READY':
						for (const { id } of packet.d.guilds) {
							this.__handleGuilds.add(id);
						}
						this.botId = packet.d.user.id;
						this.applicationId = packet.d.application.id;
						this.me = new ClientUser(this, packet.d.user, packet.d.application) as never;
						if (!this.__handleGuilds.size) {
							if ([...this.gateway.values()].every(shard => shard.data.session_id) && this.events.values.BOT_READY && (this.events.values.BOT_READY.fired ? !this.events.values.BOT_READY.data.once : true)) {
								this.events.values.BOT_READY.fired = true
								await this.events.values.BOT_READY.run(this.me!, this, shardId);
							}
						}
						this.debugger?.debug(`#${shardId}[${packet.d.user.username}](${this.botId}) is online...`);
						break;
					case 'INTERACTION_CREATE': {
						await onInteraction(shardId, packet.d, this);
						break;
					}
					case 'GUILD_CREATE': {
						if (this.__handleGuilds.has(packet.d.id)) {
							this.__handleGuilds.delete(packet.d.id);
							if ([...this.gateway.values()].every(shard => shard.data.session_id) && this.events.values.BOT_READY && (this.events.values.BOT_READY.fired ? !this.events.values.BOT_READY.data.once : true)) {
								this.events.values.BOT_READY.fired = true
								await this.events.values.BOT_READY.run(this.me!, this, shardId);
							}
							return;
						}
						break;
					}
				}
				await this.events.execute(packet.t, packet, this as Client<true>, shardId);
				break;
			}
		}
	}
}

export interface ClientOptions extends BaseClientOptions {
	presence?: (shardId: number) => GatewayPresenceUpdateData;
	shardStart?: number;
	shardEnd?: number;
}
