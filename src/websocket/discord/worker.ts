import { workerData as __workerData__, parentPort as manager } from 'node:worker_threads';
import { Cache, WorkerAdapter } from '../../cache';
import type { GatewayDispatchPayload } from '../../common';
import { Logger } from '../../common';
import { handleManagerMessages } from './handlemessage';
import type { Shard } from './shard';
import type { WorkerData } from './shared';

if (!manager) {
	throw new Error('Worker spawn without manager');
}

const workerData = __workerData__ as WorkerData;

const logger = new Logger({
	active: true,
	name: `[Worker #${workerData.workerId}]`,
});

const debugLogger = workerData.debug ? new Logger({
	active: true,
	name: `[Worker #${workerData.workerId}]`,
}) : undefined;

const shards = new Map<number, Shard>();
const cache = new Cache(workerData.intents, new WorkerAdapter(manager));

manager!.on('message', data => handleManagerMessages(data, manager!, shards, cache, logger, debugLogger));

export interface WorkerShardInfo {
	open: boolean;
	shardId: number;
	latency: number;
	resumable: boolean;
}

export type WorkerInfo = { shards: WorkerShardInfo[]; workerId: number };

type CreateWorkerMessage<T extends string, D extends object = {}> = { type: T } & D;

export type WorkerRequestConnect = CreateWorkerMessage<'CONNECT_QUEUE', { shardId: number; workerId: number }>;
export type WorkerReceivePayload = CreateWorkerMessage<
	'RECEIVE_PAYLOAD',
	{ shardId: number; workerId: number; payload: GatewayDispatchPayload }
>;
export type WorkerSendResultPayload = CreateWorkerMessage<'RESULT_PAYLOAD', { nonce: string }>;
export type WorkerSendCacheRequest = CreateWorkerMessage<
	'CACHE_REQUEST',
	{
		nonce: string;
		method:
		| 'scan'
		| 'get'
		| 'set'
		| 'patch'
		| 'values'
		| 'keys'
		| 'count'
		| 'remove'
		| 'contains'
		| 'getToRelationship'
		| 'bulkAddToRelationShip'
		| 'addToRelationship'
		| 'removeRelationship'
		| 'removeToRelationship';
		args: any[];
		workerId: number;
	}
>;
export type WorkerSendShardInfo = CreateWorkerMessage<'SHARD_INFO', WorkerShardInfo & { nonce: string }>;
export type WorkerSendInfo = CreateWorkerMessage<'WORKER_INFO', WorkerInfo & { nonce: string }>;

export type WorkerMessage =
	| WorkerRequestConnect
	| WorkerReceivePayload
	| WorkerSendResultPayload
	| WorkerSendCacheRequest
	| WorkerSendShardInfo
	| WorkerSendInfo;
