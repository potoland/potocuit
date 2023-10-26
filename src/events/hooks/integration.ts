import type {
	GatewayIntegrationCreateDispatchData,
	GatewayIntegrationDeleteDispatchData,
	GatewayIntegrationUpdateDispatchData,
} from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../../cache';

import { toCamelCase } from '@biscuitland/common';
import { User } from '../../structures/User';

export const INTEGRATION_CREATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayIntegrationCreateDispatchData
) => {
	return data.user
		? {
			...toCamelCase(data),
			user: new User(rest, cache, data.user!),
		}
		: toCamelCase(data);
};

export const INTEGRATION_UPDATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayIntegrationUpdateDispatchData
) => {
	return data.user
		? {
			...toCamelCase(data),
			user: new User(rest, cache, data.user!),
		}
		: toCamelCase(data);
};

export const INTEGRATION_DELETE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayIntegrationDeleteDispatchData
) => {
	return toCamelCase(data);
};
