import type { GatewayPresenceUpdateDispatchData } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../../cache';

import { toCamelCase } from '@biscuitland/common';

export const PRESENCE_UPDATE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayPresenceUpdateDispatchData
) => {
	return toCamelCase(data);
};
