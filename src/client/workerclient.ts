import { workerData as __workerData__, parentPort as manager } from 'node:worker_threads';
import type { Cache } from '../cache';
import { WorkerAdapter } from '../cache';
import type { GatewayDispatchPayload, GatewaySendPayload, When } from '../common';
import { LogLevels, Logger, type DeepPartial } from '../common';
import { EventHandler } from '../events';
import { ClientUser } from '../structures';
import { Shard, type WorkerData } from '../websocket';
import type {
	WorkerReady,
	WorkerReceivePayload,
	WorkerRequestConnect,
	WorkerSendInfo,
	WorkerSendResultPayload,
	WorkerSendShardInfo,
	WorkerShardInfo,
} from '../websocket/discord/worker';
import type { ManagerMessages } from '../websocket/discord/workermanager';
import type { BaseClientOptions, StartOptions } from './base';
import { BaseClient } from './base';
import { onInteraction } from './oninteraction';

const workerData = __workerData__ as WorkerData;

export class WorkerClient<Ready extends boolean = boolean> extends BaseClient {
	logger = new Logger({
		name: `[Worker #${workerData.workerId}]`,
		logLevel: LogLevels.Debug,
	});

	events = new EventHandler(this.logger);
	me!: When<Ready, ClientUser>;
	shards = new Map<number, Shard>();
	declare options: WorkerClientOptions | undefined;

	constructor(options?: WorkerClientOptions) {
		super(options);

		if (!manager) {
			throw new Error('WorkerClient cannot spawn without manager');
		}
		manager.on('message', data => this.handleManagerMessages(data));
		this.setServices({
			cache: {
				adapter: new WorkerAdapter(manager),
				disabledCache: options?.disabledCache,
			},
		});
		if (workerData.debug) {
			this.debugger = new Logger({
				name: `[Worker #${workerData.workerId}]`,
				logLevel: LogLevels.Debug,
			});
		}
	}

	get workerId() {
		return workerData.workerId;
	}

	async start(options: Omit<DeepPartial<StartOptions>, 'httpConnection' | 'token' | 'connection'> = {}) {
		await super.start(options);
		await this.loadEvents(options.eventsDir);
		this.cache.intents = workerData.intents;
	}

	async loadEvents(dir?: string) {
		dir ??= await this.getRC().then(x => x.events);
		if (dir) {
			await this.events.load(dir);
			this.logger.info('EventHandler loaded');
		}
	}

	protected async handleManagerMessages(data: ManagerMessages) {
		switch (data.type) {
			case 'CACHE_RESULT':
				if ((this.cache.adapter as WorkerAdapter).promises.has(data.nonce)) {
					(this.cache.adapter as WorkerAdapter).promises.get(data.nonce)?.(data.result);
					(this.cache.adapter as WorkerAdapter).promises.delete(data.nonce);
				}
				break;
			case 'SEND_PAYLOAD':
				{
					const shard = this.shards.get(data.shardId);
					if (!shard) {
						this.logger.fatal('Worker trying send payload by non-existent shard');
						return;
					}

					await shard.send(0, {
						...data,
					} satisfies GatewaySendPayload);

					manager!.postMessage({
						type: 'RESULT_PAYLOAD',
						nonce: data.nonce,
					} satisfies WorkerSendResultPayload);
				}
				break;
			case 'ALLOW_CONNECT':
				{
					const shard = this.shards.get(data.shardId);
					if (!shard) {
						this.logger.fatal('Worker trying connect non-existent shard');
						return;
					}
					shard.options.presence = data.presence;
					await shard.connect();
				}
				break;
			case 'SPAWN_SHARDS':
				{
					const cache = this.cache;
					const onPacket = this.onPacket.bind(this);
					for (const id of workerData.shards) {
						let shard = this.shards.get(id);
						if (!shard) {
							shard = new Shard(id, {
								token: workerData.token,
								intents: workerData.intents,
								info: data.info,
								compress: data.compress,
								debugger: this.debugger,
								async handlePayload(shardId, payload) {
									await cache.onPacket(payload);
									await onPacket?.(payload, shardId);
									manager!.postMessage({
										workerId: workerData.workerId,
										shardId,
										type: 'RECEIVE_PAYLOAD',
										payload,
									} satisfies WorkerReceivePayload);
								},
							});
							this.shards.set(id, shard);
						}

						manager!.postMessage({
							type: 'CONNECT_QUEUE',
							shardId: id,
							workerId: workerData.workerId,
						} satisfies WorkerRequestConnect);
					}
				}
				break;
			case 'SHARD_INFO':
				{
					const shard = this.shards.get(data.shardId);
					if (!shard) {
						this.logger.fatal('Worker trying get non-existent shard');
						return;
					}

					manager!.postMessage({
						...generateShardInfo(shard),
						nonce: data.nonce,
						type: 'SHARD_INFO',
					} satisfies WorkerSendShardInfo);
				}
				break;
			case 'WORKER_INFO':
				{
					manager!.postMessage({
						shards: [...this.shards.values()].map(generateShardInfo),
						workerId: workerData.workerId,
						type: 'WORKER_INFO',
						nonce: data.nonce,
					} satisfies WorkerSendInfo);
				}
				break;
			case 'BOT_READY':
				if (
					this.events.values.BOT_READY &&
					(this.events.values.BOT_READY.fired ? !this.events.values.BOT_READY.data.once : true)
				) {
					this.events.values.BOT_READY.fired ||= true;
					await this.events.values.BOT_READY.run(this.me!, this, -1);
				}
				break;
		}
	}

	protected async onPacket(packet: GatewayDispatchPayload, shardId: number) {
		switch (packet.t) {
			case 'READY':
				for (const g of packet.d.guilds) {
					this.__handleGuilds.add(g.id);
				}
				this.botId = packet.d.user.id;
				this.applicationId = packet.d.application.id;
				this.me = new ClientUser(this, packet.d.user, packet.d.application) as never;
				if (!this.__handleGuilds.size) {
					if (
						[...this.shards.values()].every(shard => shard.data.session_id) &&
						this.events.values.WORKER_READY &&
						(this.events.values.WORKER_READY.fired ? !this.events.values.WORKER_READY.data.once : true)
					) {
						manager!.postMessage({
							type: 'WORKER_READY',
							workerId: this.workerId,
						} as WorkerReady);
						this.events.values.WORKER_READY.fired ||= true;
						await this.events.values.WORKER_READY.run(this.me!, this, -1);
					}
				}
				this.debugger?.debug(`#${shardId} [${packet.d.user.username}](${this.botId}) is online...`);
				break;
			case 'INTERACTION_CREATE': {
				await onInteraction(shardId, packet.d, this);
				break;
			}
			case 'GUILD_CREATE': {
				if (this.__handleGuilds.has(packet.d.id)) {
					this.__handleGuilds.delete(packet.d.id);
					if (
						[...this.shards.values()].every(shard => shard.data.session_id) &&
						this.events.values.WORKER_READY &&
						(this.events.values.WORKER_READY.fired ? !this.events.values.WORKER_READY.data.once : true)
					) {
						manager!.postMessage({
							type: 'WORKER_READY',
							workerId: this.workerId,
						} as WorkerReady);
						this.events.values.WORKER_READY.fired ||= true;
						await this.events.values.WORKER_READY.run(this.me!, this, -1);
					}
					return;
				}
			}
		}
		await this.events.execute(packet.t, packet, this, shardId);
	}
}

export function generateShardInfo(shard: Shard): WorkerShardInfo {
	return {
		open: shard.isOpen,
		shardId: shard.id,
		latency: shard.latency,
		resumable: shard.resumable,
	};
}

interface WorkerClientOptions extends BaseClientOptions {
	disabledCache: Cache['disabledCache'];
}
