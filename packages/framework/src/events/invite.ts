import type {
	GatewayInviteCreateDispatchData,
	GatewayInviteDeleteDispatchData,
} from '@biscuitland/common';

import type { BiscuitREST } from '@biscuitland/rest';
import { type Cache, ExtendedInvite } from '@potoland/structures';

import { toCamelCase } from '@biscuitland/common';

export const INVITE_CREATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayInviteCreateDispatchData
) => {
	return new ExtendedInvite(rest, cache, data as any);
};

export const INVITE_DELETE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayInviteDeleteDispatchData
) => {
	return toCamelCase(data);
};
