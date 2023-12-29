import type { GatewayInviteCreateDispatchData, GatewayInviteDeleteDispatchData } from '@biscuitland/common';

import { toCamelCase } from '@biscuitland/common';
import type { BaseClient } from '../../client/base';

export const INVITE_CREATE = (_self: BaseClient, data: GatewayInviteCreateDispatchData) => {
	return toCamelCase(data);
};

export const INVITE_DELETE = (_self: BaseClient, data: GatewayInviteDeleteDispatchData) => {
	return toCamelCase(data);
};
