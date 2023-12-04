import type {
	GatewayReadyDispatchData,
	GatewayResumedDispatch,
} from '@biscuitland/common';
import { ClientUser } from '../../structures';
import type { BaseClient } from '../../client/base';

export const READY = (
	self: BaseClient,
	data: GatewayReadyDispatchData
) => {
	return new ClientUser(self.rest, self.cache, data.user, data.application);
};

export const RESUMED = (
	_self: BaseClient,
	_data: GatewayResumedDispatch['d']
) => {
	return;
};
