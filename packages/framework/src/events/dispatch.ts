import type {
	GatewayReadyDispatchData,
	GatewayResumedDispatch,
} from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';

import { type Cache, ClientUser } from '@potoland/structures';

export const READY = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayReadyDispatchData
) => {
	return new ClientUser(rest, cache, data.user, data.application);
};

export const RESUMED = (
	_rest: BiscuitREST,
	_cache: Cache,
	_data: GatewayResumedDispatch['d']
) => {
	return;
};
