import type { GatewayUserUpdateDispatchData } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';

import { type Cache, User } from '@potoland/structures';

export const USER_UPDATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayUserUpdateDispatchData
) => {
	return new User(rest, cache, data);
};
