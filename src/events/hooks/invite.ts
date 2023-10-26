import type {
	GatewayInviteCreateDispatchData,
	GatewayInviteDeleteDispatchData,
} from '@biscuitland/common';

import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../../cache';

import { toCamelCase } from '@biscuitland/common';

export const INVITE_CREATE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayInviteCreateDispatchData
) => {
	return toCamelCase(data);
	// return new ExtendedInvite(rest, cache, data as any);
};

export const INVITE_DELETE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayInviteDeleteDispatchData
) => {
	return toCamelCase(data);
};
