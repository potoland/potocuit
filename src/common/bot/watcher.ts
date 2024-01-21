import { watch } from 'chokidar';
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
	}

	async spawnShards() {
		this.build();
		this.resetWorker();
		const oldFn = this.options.handlePayload;
		this.options.handlePayload = (shardId, data) => {
			this.worker?.postMessage({
				shardId,
				data,
			});
			return oldFn(shardId, data);
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
