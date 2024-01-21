import { watch } from 'chokidar';
import type { GatewayDispatchPayload, GatewaySendPayload } from 'discord-api-types/v10';
import { execSync } from 'node:child_process';
import { Worker } from 'node:worker_threads';
import { ShardManager, type ShardManagerOptions } from '../../websocket';
import { Logger } from '../it/logger';

export class Watcher extends ShardManager {
	worker?: Worker;
	logger = new Logger({
		name: '[Watcher]',
	});
	declare options: WatcherOptions;

	constructor(options: WatcherOptions) {
		super(options);
	}

	resetWorker() {
		if (this.worker) {
			this.worker.terminate();
		}
		this.worker = new Worker(this.options.filePath, {
			argv: this.options.argv,
			workerData: {
				__USING_WATCHER__: true,
			},
		});
		this.worker!.on('message', (data: WatcherSendToShard) => {
			switch (data.type) {
				case 'SEND_TO_SHARD':
					this.send(data.shardId, data.payload)
					break;
			}
		})
	}

	async spawnShards() {
		this.build();
		this.resetWorker();
		const oldFn = this.options.handlePayload;
		this.options.handlePayload = (shardId, payload) => {
			this.worker?.postMessage({
				type: 'PAYLOAD',
				shardId,
				payload,
			} satisfies WatcherPayload);
			return oldFn(shardId, payload);
		};
		await super.spawnShards();
		const watcher = watch(this.options.srcPath).on('ready', () => {
			this.logger.debug(`Watching ${this.options.srcPath}`);
			watcher.on('all', event => {
				this.logger.debug(`${event} event detected, building`);
				this.build();
				this.resetWorker();
			});
		});
	}

	protected build() {
		execSync(`cd ${process.cwd()} && ${this.options.transpileCommand}`);
		this.logger.info('Builded');
	}
}

export interface WatcherOptions extends Omit<ShardManagerOptions, 'debug'> {
	filePath: string;
	transpileCommand: string;
	srcPath: string;
	argv?: string[];
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
