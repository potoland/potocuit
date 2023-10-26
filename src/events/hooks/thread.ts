import type {
	GatewayThreadCreateDispatchData,
	GatewayThreadDeleteDispatchData,
	GatewayThreadListSyncDispatchData,
	GatewayThreadMemberUpdateDispatchData,
	GatewayThreadMembersUpdateDispatchData,
	GatewayThreadUpdateDispatchData,
} from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../../cache';

import { toCamelCase } from '@biscuitland/common';
import { ThreadChannel } from '../../structures/channels';

export const THREAD_CREATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayThreadCreateDispatchData
) => {
	return new ThreadChannel(rest, cache, data);
};

export const THREAD_DELETE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayThreadDeleteDispatchData
) => {
	return new ThreadChannel(rest, cache, data);
};

export const THREAD_LIST_SYNC = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayThreadListSyncDispatchData
) => {
	return toCamelCase(data);
};

export const THREAD_MEMBER_UPDATE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayThreadMemberUpdateDispatchData
) => {
	return toCamelCase(data);
};

export const THREAD_MEMBERS_UPDATE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayThreadMembersUpdateDispatchData
) => {
	return toCamelCase(data);
};

export const THREAD_UPDATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayThreadUpdateDispatchData
) => {
	return new ThreadChannel(rest, cache, data);
};
