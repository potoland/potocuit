import type { BaseClient } from '../../client/base';
import { User } from '../../structures';
import type {
	GatewayIntegrationCreateDispatchData,
	GatewayIntegrationDeleteDispatchData,
	GatewayIntegrationUpdateDispatchData,
} from '../../common';
import { toCamelCase } from '../../common';

export const INTEGRATION_CREATE = (self: BaseClient, data: GatewayIntegrationCreateDispatchData) => {
	return data.user
		? {
			...toCamelCase(data),
			user: new User(self, data.user!),
		}
		: toCamelCase(data);
};

export const INTEGRATION_UPDATE = (self: BaseClient, data: GatewayIntegrationUpdateDispatchData) => {
	return data.user
		? {
			...toCamelCase(data),
			user: new User(self, data.user!),
		}
		: toCamelCase(data);
};

export const INTEGRATION_DELETE = (
	_self: BaseClient,

	data: GatewayIntegrationDeleteDispatchData,
) => {
	return toCamelCase(data);
};
