import type { BaseClient } from '../../client/base';
import { User } from '../../structures';
import type { GatewayUserUpdateDispatchData } from '../../common';

export const USER_UPDATE = (self: BaseClient, data: GatewayUserUpdateDispatchData) => {
	return new User(self, data);
};
