import type { MessagePort } from 'worker_threads';
import { workerData } from 'worker_threads';
import { Shard } from '.';
import type { Cache, WorkerAdapter } from '../../cache';
import type { GatewayDispatchPayload, GatewaySendPayload, Logger } from '../../common';
import type { WorkerShardInfo } from './worker';
import {
	type WorkerReceivePayload,
	type WorkerRequestConnect,
	type WorkerSendInfo,
	type WorkerSendResultPayload,
	type WorkerSendShardInfo,
} from './worker';
import type { ManagerMessages } from './workermanager';

export async function handleManagerMessages(
	data: ManagerMessages,
	manager: MessagePort,
	shards: Map<number, Shard>,
	cache: Cache,
	logger: Logger,
	onPacket?: (payload: GatewayDispatchPayload, shardId: number) => any,
) {
	switch (data.type) {
		case 'CACHE_RESULT':
			if ((cache.adapter as WorkerAdapter).promises.has(data.nonce)) {
				(cache.adapter as WorkerAdapter).promises.get(data.nonce)?.(data.result);
				(cache.adapter as WorkerAdapter).promises.delete(data.nonce);
			}
			break;
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
				nonce: data.nonce,
			} satisfies WorkerSendResultPayload);
		}
			break;
		case 'ALLOW_CONNECT': {
			const shard = shards.get(data.shardId);
			if (!shard) {
				logger.fatal('Worker trying connect non-existent shard');
				return;
			}
			shard.options.presence = data.presence;
			await shard.connect();
		}
			break;
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
					shards.set(id, shard);
				}

				manager!.postMessage({
					type: 'CONNECT_QUEUE',
					shardId: id,
					workerId: workerData.workerId,
				} satisfies WorkerRequestConnect);
			}
		}
			break;
		case 'SHARD_INFO': {
			const shard = shards.get(data.shardId);
			if (!shard) {
				logger.fatal('Worker trying get non-existent shard');
				return;
			}

			manager!.postMessage({
				...generateShardInfo(shard),
				nonce: data.nonce,
				type: 'SHARD_INFO',
			} satisfies WorkerSendShardInfo);
		}
			break;
		case 'WORKER_INFO': {
			manager!.postMessage({
				shards: [...shards.values()].map(generateShardInfo),
				workerId: workerData.workerId,
				type: 'WORKER_INFO',
				nonce: data.nonce,
			} satisfies WorkerSendInfo);
		}
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
