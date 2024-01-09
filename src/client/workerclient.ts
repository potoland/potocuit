import { workerData as __workerData__, parentPort as manager } from 'node:worker_threads';
import type { Cache } from '../cache';
import { WorkerAdapter } from '../cache';
import type { GatewayDispatchPayload } from '../common';
import { LogLevels, Logger, type DeepPartial } from '../common';
import { EventHandler } from '../events';
import type { Shard, WorkerData } from '../websocket';
import { handleManagerMessages } from '../websocket/discord/handlemessage';
import type { ManagerMessages } from '../websocket/discord/workermanager';
import type { BaseClientOptions, StartOptions } from './base';
import { BaseClient } from './base';
import { onInteraction } from './oninteraction';

const workerData = __workerData__ as WorkerData;

export class WorkerClient extends BaseClient {
	logger = new Logger({
		active: true,
		name: `[Worker #${workerData.workerId}]`,
		logLevel: LogLevels.Debug,
	});

	events = new EventHandler(this.logger);

	shards = new Map<number, Shard>();
	declare options: WorkerClientOptions | undefined;

	constructor(options?: WorkerClientOptions) {
		super(options);

		if (!manager) {
			throw new Error('WorkerClient cannot spawn without manager');
		}
		const onPacket = this.onPacket.bind(this);
		manager!.on('message', data =>
			handleManagerMessages(data, manager!, this.shards, this.cache, this.logger, onPacket),
		);
		this.setServices({
			cache: {
				adapter: new WorkerAdapter(manager),
				disabledCache: options?.disabledCache,
			},
		});
	}

	get workerId() {
		return workerData.workerId;
	}

	handleManagerMessages(data: ManagerMessages) {
		return handleManagerMessages(data, manager!, this.shards, this.cache, this.logger, this.onPacket.bind(this));
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

	protected async onPacket(packet: GatewayDispatchPayload, shardId: number) {
		switch (packet.t) {
			case 'READY':
				for (const { id } of packet.d.guilds) {
					this.__handleGuilds.add(id);
				}
				this.botId = packet.d.user.id;
				this.applicationId = packet.d.application.id;
				this.debugger?.debug(`#${shardId} [${packet.d.user.username}](${this.botId}) is online...`);
				break;
			case 'INTERACTION_CREATE': {
				await onInteraction(shardId, packet.d, this);
				break;
			}
			case 'GUILD_CREATE': {
				if (this.__handleGuilds.has(packet.d.id)) {
					this.__handleGuilds.delete(packet.d.id);
					return;
				}
			}
		}
		await this.events.execute(packet.t, packet, this, shardId);
	}
}

interface WorkerClientOptions extends BaseClientOptions {
	disabledCache: Cache['disabledCache'];
}
