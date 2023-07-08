import type { GatewayWebhooksUpdateDispatchData } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';

import type { Cache } from '@potoland/structures';

import { toCamelCase } from '@biscuitland/common';

export const WEBHOOKS_UPDATE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayWebhooksUpdateDispatchData
) => {
	return toCamelCase(data);
};
