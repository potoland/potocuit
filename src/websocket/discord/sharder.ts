import { GatewayOpcodes, GatewayUpdatePresence, GatewayVoiceStateUpdate, LogLevels, Logger, MergeOptions, ObjectToLower, toSnakeCase } from '../../common';
import { ShardManagerDefaults } from '../constants';
import { SequentialBucket } from '../structures';
import { Shard } from './shard.js';
import type { ShardManagerOptions } from './shared';

export class ShardManager extends Map<number, Shard> {
	connectQueue: SequentialBucket;
	options: ShardManagerOptions;
	logger: Logger;

	constructor(options: ShardManagerOptions) {
		super();
		options.totalShards ??= options.info.shards;
		this.options = MergeOptions<Required<ShardManagerOptions>>(ShardManagerDefaults, options);
		this.connectQueue = new SequentialBucket(this.concurrency);

		this.logger = new Logger({
			active: this.options.debug,
			name: '[ShardManager]',
			logLevel: LogLevels.Debug,
		});
	}

	get remaining() {
		return this.options.info.session_start_limit.remaining;
	}

	get concurrency() {
		return this.options.info.session_start_limit.max_concurrency;
	}

	get latency() {
		let acc = 0;

		this.forEach((s) => (acc += s.latency));

		return acc / this.size;
	}

	calculeShardId(guildId: string) {
		return Number((BigInt(guildId) >> 22n) % BigInt(this.options.info.shards ?? 1));
	}

	spawn(shardId: number) {
		this.logger.info(`Spawn shard ${shardId}`);
		let shard = this.get(shardId);

		shard ??= new Shard(shardId, {
			token: this.options.token,
			intents: this.options.intents,
			info: { ...this.options.info, shards: this.options.totalShards! },
			handlePayload: this.options.handlePayload,
			properties: this.options.properties,
			logger: this.logger,
			compress: false,
			presence: this.options.presence?.(shardId, -1),
		});

		this.set(shardId, shard);

		return shard;
	}

	async spawnShards(): Promise<void> {
		const buckets = this.spawnBuckets();

		this.logger.info('Spawn shards');
		for (const bucket of buckets) {
			for (const shard of bucket) {
				if (!shard) {
					break;
				}
				this.logger.info(`${shard.id} add to connect queue`);
				await this.connectQueue.push(shard.connect.bind(shard));
			}
		}
	}

	/*
	 * spawns buckets in order
	 * https://discord.com/developers/docs/topics/gateway#sharding-max-concurrency
	 */
	spawnBuckets(): Shard[][] {
		this.logger.info('#0 Preparing buckets');
		const chunks = SequentialBucket.chunk(new Array(this.options.totalShards), this.concurrency);
		chunks.forEach((arr: any[], index: number) => {
			for (let i = 0; i < arr.length; i++) {
				const id = i + (index > 0 ? index * this.concurrency : 0);
				chunks[index][i] = this.spawn(id);
			}
		});
		this.logger.info(`${chunks.length} buckets created`);
		return chunks;
	}

	forceIdentify(shardId: number) {
		this.logger.info(`Shard #${shardId} force identify`);
		return this.spawn(shardId).identify();
	}

	disconnect(shardId: number) {
		this.logger.info(`Shard #${shardId} force disconnect`);
		return this.get(shardId)?.disconnect();
	}

	disconnectAll() {
		this.logger.info('Disconnect all shards');
		return new Promise((resolve) => {
			this.forEach((shard) => shard.disconnect());
			resolve(null);
		});
	}

	setShardPresence(shardId: number, payload: GatewayUpdatePresence['d']) {
		this.logger.info(`Shard #${shardId} update presence`);
		return this.get(shardId)?.send<GatewayUpdatePresence>(1, {
			op: GatewayOpcodes.PresenceUpdate,
			d: payload,
		});
	}

	setPresence(payload: GatewayUpdatePresence['d']): Promise<void> | undefined {
		return new Promise((resolve) => {
			this.forEach((shard) => {
				this.setShardPresence(shard.id, payload);
			}, this);
			resolve();
		});
	}

	joinVoice(
		guild_id: string,
		channel_id: string,
		options: ObjectToLower<Pick<GatewayVoiceStateUpdate['d'], 'self_deaf' | 'self_mute'>>,
	) {
		const shardId = this.calculeShardId(guild_id);
		this.logger.info(`Shard #${shardId} join voice ${channel_id} in ${guild_id}`);

		return this.get(shardId)?.send<GatewayVoiceStateUpdate>(1, {
			op: GatewayOpcodes.VoiceStateUpdate,
			d: {
				guild_id,
				channel_id,
				...toSnakeCase(options),
			},
		});
	}

	leaveVoice(guild_id: string) {
		const shardId = this.calculeShardId(guild_id);
		this.logger.info(`Shard #${shardId} leave voice in ${guild_id}`);

		return this.get(shardId)?.send<GatewayVoiceStateUpdate>(1, {
			op: GatewayOpcodes.VoiceStateUpdate,
			d: {
				guild_id,
				channel_id: null,
				self_mute: false,
				self_deaf: false,
			},
		});
	}
}
