import { randomUUID } from 'node:crypto';
import { parentPort, workerData, type MessagePort } from 'node:worker_threads';
import type { WorkerData } from '../../websocket';
import type { WorkerSendCacheRequest } from '../../websocket/discord/worker';
import type { Adapter } from './types';

export class WorkerAdapter implements Adapter {
	promises = new Map<string, { resolve: (value: unknown) => void; timeout: NodeJS.Timeout }>();

	constructor(readonly parent: MessagePort) {}

	protected send(method: WorkerSendCacheRequest['method'], ...args: any[]): Promise<any> {
		const nonce = randomUUID();
		if (this.promises.has(nonce)) return this.send(method, ...args);

		parentPort!.postMessage({
			type: 'CACHE_REQUEST',
			args,
			nonce,
			method,
			workerId: (workerData as WorkerData).workerId,
		} satisfies WorkerSendCacheRequest);

		let resolve = (_: any) => {
			/**/
		};
		let timeout = -1 as unknown as NodeJS.Timeout;

		const promise = new Promise<any>((res, rej) => {
			resolve = res;
			timeout = setTimeout(() => {
				this.promises.delete(nonce);
				rej(new Error('Timeout cache request'));
			}, 60e3);
		});

		this.promises.set(nonce, { resolve, timeout });

		return promise;
	}

	scan(...rest: any[]) {
		return this.send('scan', ...rest);
	}

	get(...rest: any[]) {
		return this.send('get', ...rest);
	}

	set(...rest: any[]) {
		return this.send('set', ...rest);
	}

	patch(...rest: any[]) {
		return this.send('patch', ...rest);
	}

	values(...rest: any[]) {
		return this.send('values', ...rest);
	}

	keys(...rest: any[]) {
		return this.send('keys', ...rest);
	}

	count(...rest: any[]) {
		return this.send('count', ...rest);
	}

	remove(...rest: any[]) {
		return this.send('remove', ...rest);
	}

	contains(...rest: any[]) {
		return this.send('contains', ...rest);
	}

	getToRelationship(...rest: any[]) {
		return this.send('getToRelationship', ...rest);
	}

	bulkAddToRelationShip(...rest: any[]) {
		return this.send('bulkAddToRelationShip', ...rest);
	}

	addToRelationship(...rest: any[]) {
		return this.send('addToRelationship', ...rest);
	}

	removeToRelationship(...rest: any[]) {
		return this.send('removeToRelationship', ...rest);
	}

	removeRelationship(...rest: any[]) {
		return this.send('removeRelationship', ...rest);
	}
}
