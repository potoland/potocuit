import type {
	GatewayStageInstanceCreateDispatchData,
	GatewayStageInstanceDeleteDispatchData,
} from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';

import type { Cache } from '../../cache';
import { toCamelCase } from '@biscuitland/common';

export const STAGE_INSTANCE_CREATE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayStageInstanceCreateDispatchData
) => {
	return toCamelCase(data);
};

export const STAGE_INSTANCE_DELETE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayStageInstanceDeleteDispatchData
) => {
	return toCamelCase(data);
};

export const STAGE_INSTANCE_UPDATE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayStageInstanceDeleteDispatchData
) => {
	return toCamelCase(data);
};
