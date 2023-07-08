import type {
	GatewayIntegrationCreateDispatchData,
	GatewayIntegrationDeleteDispatchData,
	GatewayIntegrationUpdateDispatchData,
	GatewayInteractionCreateDispatchData,
} from '@biscuitland/common';

import type { BiscuitREST } from '@biscuitland/rest';
import { User, type Cache, interactionFactory } from '@potoland/structures';

import { toCamelCase } from '@biscuitland/common';

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

export const INTERACTION_CREATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayInteractionCreateDispatchData
) => {
	return interactionFactory(rest, cache, data);
};
