import { parentPort as manager, workerData as __workerData__ } from 'worker_threads';
import { Shard } from './shard';
import { Logger } from '@biscuitland/common';
import type { GatewayDispatchPayload, GatewaySendPayload } from '@biscuitland/common';
import type { WorkerData } from './shared';
import type { ManagerMessages } from './workermanager';

if (!manager) {
	throw new Error('Worker spawn without manager');
}

const workerData = __workerData__ as WorkerData;

const logger = new Logger({
	active: workerData.debug,
	name: `[Worker #${workerData.workerId}]`
});

const shards = new Map<number, Shard>();

manager!.on('message', data => handleManagerMessages(data));

async function handleManagerMessages(data: ManagerMessages) {
	switch (data.type) {
		case 'SEND_PAYLOAD': {
			const shard = shards.get(data.shardId);
			if (!shard) {
				logger.fatal('Worker trying send payload by non-existent shard');
				return;
			}

			await shard.send(0, {
				...data,
			} satisfies GatewaySendPayload);

			manager!.postMessage({
				type: 'RESULT_PAYLOAD',
				nonce: data.nonce
			} satisfies WorkerSendResultPayload);
		} break;
		case 'ALLOW_CONNECT': {
			const shard = shards.get(data.shardId);
			if (!shard) {
				logger.fatal('Worker trying connect non-existent shard');
				return;
			}
			shard.options.presence = data.presence;
			await shard.connect();
		} break;
		case 'SPAWN_SHARDS': {
			for (const id of workerData.shards) {
				let shard = shards.get(id);

				if (!shard) {
					shard = new Shard(id, {
						token: workerData.token,
						intents: workerData.intents,
						info: data.info,
						compress: data.compress,
						logger,
						handlePayload(shardId, payload) {
							manager!.postMessage({
								workerId: workerData.workerId,
								shardId,
								type: 'RECEIVE_PAYLOAD',
								payload,
							} satisfies WorkerReceivePayload);
						},
					});
					shards.set(id, shard);
				}

				manager!.postMessage({
					type: 'CONNECT_QUEUE',
					shardId: id,
					workerId: workerData.workerId
				} satisfies WorkerRequestConnect);
			}
		} break;
	}
}


type CreateWorkerMessage<T extends string, D extends object = {}> = { type: T } & D;

export type WorkerRequestConnect = CreateWorkerMessage<'CONNECT_QUEUE', { shardId: number; workerId: number }>;
export type WorkerReceivePayload = CreateWorkerMessage<'RECEIVE_PAYLOAD', { shardId: number; workerId: number; payload: GatewayDispatchPayload }>;
export type WorkerSendResultPayload = CreateWorkerMessage<'RESULT_PAYLOAD', { nonce: string }>;

export type WorkerMessage = WorkerRequestConnect | WorkerReceivePayload | WorkerSendResultPayload;
