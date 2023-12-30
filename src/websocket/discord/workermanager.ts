import { randomUUID } from 'crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { join } from 'path';
import { Worker } from 'worker_threads';
import { DefaultMemoryAdapter, type Adapter } from '../../cache';
import { GatewayPresenceUpdateData, GatewaySendPayload, Logger, MergeOptions } from '../../common';
import { WorkerManagerDefaults } from '../constants';
import { SequentialBucket } from '../structures';
import type { ShardOptions, WorkerData, WorkerManagerOptions } from './shared';
import type { WorkerInfo, WorkerMessage, WorkerShardInfo } from './worker';

export class WorkersManger extends Map<number, Worker> {
	options: Required<WorkerManagerOptions>;
	logger: Logger;
	connectQueue: SequentialBucket;
	cacheAdapter: Adapter;
	promises = new Map<string, (value: any) => void>();
	constructor(options: WorkerManagerOptions) {
		super();
		options.totalShards ??= options.info.shards;
		this.options = MergeOptions<Required<WorkerManagerOptions>>(WorkerManagerDefaults, options);
		this.options.workers ??= Math.ceil(this.options.totalShards / this.options.shardsPerWorker);
		this.options.info.shards = options.totalShards;
		this.connectQueue = new SequentialBucket(this.concurrency);

		this.logger = new Logger({
			active: this.options.debug,
			name: '[WorkerManager]',
		});

		if (this.totalShards / this.shardsPerWorker > this.workers) {
			throw new Error(
				`Cannot create enough shards in the specified workers, minimum: ${Math.ceil(
					this.totalShards / this.shardsPerWorker,
				)}`,
			);
		}

		this.cacheAdapter = new DefaultMemoryAdapter();
	}

	setCache(adapter: Adapter) {
		this.cacheAdapter = adapter;
	}

	get remaining() {
		return this.options.info.session_start_limit.remaining;
	}

	get concurrency() {
		return this.options.info.session_start_limit.max_concurrency;
	}

	get totalWorkers() {
		return this.options.workers;
	}

	get totalShards() {
		return this.options.totalShards;
	}

	get shardsPerWorker() {
		return this.options.shardsPerWorker;
	}

	get workers() {
		return this.options.workers;
	}

	async syncLatency({ shardId, workerId }: { shardId?: number; workerId?: number }) {
		if (typeof shardId !== 'number' && typeof workerId !== 'number') {
			return;
		}

		const id = workerId ?? this.calculateWorkerId(shardId!);

		if (!this.has(id)) {
			throw new Error(`Worker #${workerId} doesnt exist`);
		}

		const data = await this.getWorkerInfo(id);

		return data.shards.reduce((acc, prv) => acc + prv.latency, 0) / data.shards.length;
	}

	calculateShardId(guildId: string) {
		return Number((BigInt(guildId) >> 22n) % BigInt(this.options.info.shards ?? 1));
	}

	calculateWorkerId(shardId: number) {
		const workerId = Math.floor(shardId / this.shardsPerWorker);
		if (workerId >= this.workers) {
			throw new Error('Invalid shardId');
		}
		return workerId;
	}

	prepareSpaces() {
		this.logger.info('Preparing buckets');

		const chunks = SequentialBucket.chunk<number>(new Array(this.options.totalShards), this.options.shardsPerWorker);

		chunks.forEach((shards, index) => {
			for (let i = 0; i < shards.length; i++) {
				const id = i + (index > 0 ? index * this.options.shardsPerWorker : 0);
				chunks[index][i] = id;
			}
		});

		this.logger.info(`${chunks.length} buckets created`);
		return chunks;
	}

	async prepareWorkers(shards: number[][]) {
		for (let i = 0; i < shards.length; i++) {
			let worker = this.get(i);
			if (!worker) {
				worker = this.createWorker({
					path: this.options.path ?? `${join(__dirname, './worker.js')}`,
					debug: this.options.debug,
					token: this.options.token,
					shards: shards[i],
					intents: this.options.intents,
					workerId: i,
				});
				this.set(i, worker);
			}
			console.log(this.options.info);
			worker.postMessage({
				type: 'SPAWN_SHARDS',
				compress: this.options.compress ?? false,
				info: this.options.info,
				properties: this.options.properties,
			} satisfies ManagerSpawnShards);
			await delay(69);
		}
	}

	createWorker(workerData: WorkerData) {
		const worker = new Worker(workerData.path, { workerData });

		worker.on('message', (data) => this.handleWorkerMessage(data));

		return worker;
	}

	async spawn(workerId: number, shardId: number) {
		await this.connectQueue.push(async () => {
			const worker = this.get(workerId);
			if (!worker) {
				this.logger.fatal("Trying spawn with worker doesn't exist");
				return;
			}

			worker.postMessage({
				type: 'ALLOW_CONNECT',
				shardId,
				presence: this.options.presence(shardId, workerId),
			} satisfies ManagerAllowConnect);
		});
	}

	async handleWorkerMessage(message: WorkerMessage) {
		switch (message.type) {
			case 'CONNECT_QUEUE':
				this.spawn(message.workerId, message.shardId);
				break;
			case 'CACHE_REQUEST': {
				const worker = this.get(message.workerId);
				if (!worker) {
					throw new Error('Invalid request from unavailable worker');
				}
				// @ts-expect-error
				const result = await this.cacheAdapter[message.method](...message.args);
				worker.postMessage({
					type: 'CACHE_RESULT',
					nonce: message.nonce,
					result,
				} as ManagerSendCacheResult);
			}
				break;
			case 'RECEIVE_PAYLOAD': {
				this.options.handlePayload(message.shardId, message.workerId, message.payload);
			}
				break;
			case 'RESULT_PAYLOAD': {
				const resolve = this.promises.get(message.nonce);
				if (!resolve) {
					return;
				}
				this.promises.delete(message.nonce);
				resolve(true);
			}
				break;
			case 'SHARD_INFO': {
				const { nonce, type, ...data } = message;
				const resolve = this.promises.get(nonce);
				if (!resolve) {
					return;
				}
				resolve(data);
			}
				break;
			case 'WORKER_INFO': {
				const { nonce, type, ...data } = message;
				const resolve = this.promises.get(nonce);
				if (!resolve) {
					return;
				}
				resolve(data);
			}
		}
	}

	private generateNonce(large = true) {
		const nonce = randomUUID();
		return large ? nonce : nonce.split('-')[0];
	}

	private generateSendPromise<T = unknown>(nonce: string, message = 'Timeout') {
		let resolve = (_: T) => {
			/**/
		};

		const promise = new Promise<T>((res, rej) => {
			resolve = res;
			setTimeout(() => {
				rej(new Error(message));
			}, 3e3);
		});

		this.promises.set(nonce, resolve);

		return promise;
	}

	async send(data: GatewaySendPayload, shardId: number) {
		const workerId = this.calculateWorkerId(shardId);
		const worker = this.get(workerId);

		if (!worker) {
			throw new Error(`Worker #${workerId} doesnt exist`);
		}

		const nonce = this.generateNonce();

		worker.postMessage({
			type: 'SEND_PAYLOAD',
			shardId,
			nonce,
			...data,
		} satisfies ManagerSendPayload);

		return this.generateSendPromise<true>(nonce, 'Shard send payload timeout');
	}

	async getShardInfo(shardId: number) {
		const workerId = this.calculateWorkerId(shardId);
		const worker = this.get(workerId);

		if (!worker) {
			throw new Error(`Worker #${workerId} doesnt exist`);
		}

		const nonce = this.generateNonce(false);

		worker.postMessage({ shardId, nonce, type: 'SHARD_INFO' } satisfies ManagerRequestShardInfo);

		return this.generateSendPromise<WorkerShardInfo>(nonce, 'Get shard info timeout');
	}

	async getWorkerInfo(workerId: number) {
		const worker = this.get(workerId);

		if (!worker) {
			throw new Error(`Worker #${workerId} doesnt exist`);
		}

		const nonce = this.generateNonce();

		worker.postMessage({ nonce, type: 'WORKER_INFO' } satisfies ManagerRequestWorkerInfo);

		return this.generateSendPromise<WorkerInfo>(nonce, 'Get worker info timeout');
	}

	async start() {
		const spaces = this.prepareSpaces();
		await this.prepareWorkers(spaces);
	}
}

type CreateManagerMessage<T extends string, D extends object = {}> = { type: T } & D;

export type ManagerAllowConnect = CreateManagerMessage<
	'ALLOW_CONNECT',
	{ shardId: number; presence: GatewayPresenceUpdateData }
>;
export type ManagerSpawnShards = CreateManagerMessage<
	'SPAWN_SHARDS',
	Pick<ShardOptions, 'info' | 'properties' | 'compress'>
>;
export type ManagerSendPayload = CreateManagerMessage<
	'SEND_PAYLOAD',
	GatewaySendPayload & { shardId: number; nonce: string }
>;
export type ManagerRequestShardInfo = CreateManagerMessage<'SHARD_INFO', { nonce: string; shardId: number }>;
export type ManagerRequestWorkerInfo = CreateManagerMessage<'WORKER_INFO', { nonce: string }>;
export type ManagerSendCacheResult = CreateManagerMessage<'CACHE_RESULT', { nonce: string; result: any }>;

export type ManagerMessages =
	| ManagerAllowConnect
	| ManagerSpawnShards
	| ManagerSendPayload
	| ManagerRequestShardInfo
	| ManagerRequestWorkerInfo
	| ManagerSendCacheResult;
