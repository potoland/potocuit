import { watch } from 'chokidar';
import type { GatewayDispatchPayload, GatewaySendPayload } from 'discord-api-types/v10';
import { execSync } from 'node:child_process';
import { Worker } from 'node:worker_threads';
import { REST, Router } from '../../api';
import { BaseClient, type InternalRuntimeConfig } from '../../client/base';
import { ShardManager, type ShardManagerOptions } from '../../websocket';
import { Logger } from '../it/logger';
import type { MakeRequired } from '../types/util';

export class Watcher extends ShardManager {
	worker?: Worker;
	logger = new Logger({
		name: '[Watcher]',
	});
	rest?: REST;
	declare options: MakeRequired<WatcherOptions, 'intents' | 'token' | 'handlePayload' | 'info'>;

	constructor(options: WatcherOptions) {
		super({
			handlePayload() { },
			token: '',
			intents: 0,
			info: {
				url: 'wss://gateway.discord.gg',
				session_start_limit: {
					max_concurrency: -1,
					remaining: -1,
					reset_after: -1,
					total: -1,
				},
				shards: -1,
			},
			...options,
		});
	}

	resetWorker() {
		if (this.worker) {
			this.worker.terminate();
		}
		this.build();
		this.worker = new Worker(this.options.filePath, {
			argv: this.options.argv,
			workerData: {
				__USING_WATCHER__: true,
			},
		});
		this.worker!.on('message', (data: WatcherSendToShard) => {
			switch (data.type) {
				case 'SEND_TO_SHARD':
					this.send(data.shardId, data.payload);
					break;
			}
		});
	}

	async spawnShards() {
		const RC = await BaseClient.prototype.getRC<InternalRuntimeConfig>();
		this.options.token = RC.token;
		this.rest ??= new REST({
			token: this.options.token,
		});
		this.options.intents = RC.intents;
		this.options.info = await new Router(this.rest!).createProxy().gateway.bot.get();
		this.options.totalShards = this.options.info.shards;

		this.resetWorker();

		const oldFn = this.options.handlePayload;
		this.options.handlePayload = (shardId, payload) => {
			this.worker?.postMessage({
				type: 'PAYLOAD',
				shardId,
				payload,
			} satisfies WatcherPayload);
			return oldFn?.(shardId, payload);
		};
		this.connectQueue.concurrency = this.options.info.session_start_limit.max_concurrency;

		await super.spawnShards();
		const watcher = watch(this.options.srcPath).on('ready', () => {
			this.logger.debug(`Watching ${this.options.srcPath}`);
			watcher.on('all', event => {
				this.logger.debug(`${event} event detected, building`);
				this.resetWorker();
			});
		});
	}

	protected build() {
		execSync(`cd ${process.cwd()} && ${this.options.transpileCommand}`);
		this.logger.info('Builded');
	}
}

export interface WatcherOptions
	extends Omit<ShardManagerOptions, 'debug' | 'handlePayload' | 'info' | 'token' | 'intents'> {
	filePath: string;
	transpileCommand: string;
	srcPath: string;
	argv?: string[];
	handlePayload?: ShardManagerOptions['handlePayload'];
	info?: ShardManagerOptions['info'];
	token?: ShardManagerOptions['token'];
	intents?: ShardManagerOptions['intents'];
}

export interface WatcherPayload {
	type: 'PAYLOAD';
	shardId: number;
	payload: GatewayDispatchPayload;
}

export interface WatcherSendToShard {
	type: 'SEND_TO_SHARD';
	shardId: number;
	payload: GatewaySendPayload;
}
