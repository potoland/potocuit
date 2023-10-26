import type { GatewayApplicationCommandPermissionsUpdateDispatchData } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../../cache';

export const APPLICATION_COMMAND_PERMISSIONS_UPDATE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayApplicationCommandPermissionsUpdateDispatchData
) => {
	return data;
};
