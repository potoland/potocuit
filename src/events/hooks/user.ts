import type { GatewayUserUpdateDispatchData } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../../cache';

import { User } from '../../structures/User';

export const USER_UPDATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayUserUpdateDispatchData
) => {
	return new User(rest, cache, data);
};
