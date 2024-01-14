import type { BaseClient } from '../../client/base';

export const SHARD_READY = (_self: BaseClient, shardId: number) => {
	return shardId;
};
