import type {
	GatewayChannelCreateDispatchData,
	GatewayChannelDeleteDispatchData,
	GatewayChannelPinsUpdateDispatchData,
	GatewayChannelUpdateDispatchData,
} from '@biscuitland/common';

import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '@potoland/structures';

import { channelFactory } from '@potoland/structures';

export const CHANNEL_CREATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayChannelCreateDispatchData
) => {
	return channelFactory(rest, cache, data);
};

export const CHANNEL_DELETE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayChannelDeleteDispatchData
) => {
	return channelFactory(rest, cache, data);
};

export const CHANNEL_PINS_UPDATE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayChannelPinsUpdateDispatchData
) => {
	return data;
};

export const CHANNEL_UPDATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayChannelUpdateDispatchData
) => {
	return channelFactory(rest, cache, data);
};
