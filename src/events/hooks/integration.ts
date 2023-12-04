import type {
	GatewayIntegrationCreateDispatchData,
	GatewayIntegrationDeleteDispatchData,
	GatewayIntegrationUpdateDispatchData,
} from '@biscuitland/common';
import { toCamelCase } from '@biscuitland/common';
import { User } from '../../structures';
import type { BaseClient } from '../../client/base';

export const INTEGRATION_CREATE = (
	self: BaseClient,
	data: GatewayIntegrationCreateDispatchData
) => {
	return data.user
		? {
			...toCamelCase(data),
			user: new User(self.rest, self.cache, data.user!),
		}
		: toCamelCase(data);
};

export const INTEGRATION_UPDATE = (
	self: BaseClient,
	data: GatewayIntegrationUpdateDispatchData
) => {
	return data.user
		? {
			...toCamelCase(data),
			user: new User(self.rest, self.cache, data.user!),
		}
		: toCamelCase(data);
};

export const INTEGRATION_DELETE = (
	_self: BaseClient,

	data: GatewayIntegrationDeleteDispatchData
) => {
	return toCamelCase(data);
};
