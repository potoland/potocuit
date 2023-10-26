import type {
	GatewayChannelCreateDispatchData,
	GatewayChannelDeleteDispatchData,
	GatewayChannelPinsUpdateDispatchData,
	GatewayChannelUpdateDispatchData,
} from '@biscuitland/common';

import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../../cache';
import { BaseChannel } from '../../structures/methods/channel/base';

export const CHANNEL_CREATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayChannelCreateDispatchData
) => {
	return BaseChannel.from(data, rest, cache);
};

export const CHANNEL_DELETE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayChannelDeleteDispatchData
) => {
	return BaseChannel.from(data, rest, cache);
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
	return BaseChannel.from(data, rest, cache);
};
