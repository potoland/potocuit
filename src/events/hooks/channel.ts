import {
	toCamelCase,
	type GatewayChannelCreateDispatchData,
	type GatewayChannelDeleteDispatchData,
	type GatewayChannelPinsUpdateDispatchData,
	type GatewayChannelUpdateDispatchData,
} from '../../common';

import type { BaseClient } from '../../client/base';
import channelFrom from '../../structures/methods/channels';

export const CHANNEL_CREATE = (self: BaseClient, data: GatewayChannelCreateDispatchData) => {
	return channelFrom(data, self);
};

export const CHANNEL_DELETE = (self: BaseClient, data: GatewayChannelDeleteDispatchData) => {
	return channelFrom(data, self);
};

export const CHANNEL_PINS_UPDATE = (_self: BaseClient, data: GatewayChannelPinsUpdateDispatchData) => {
	return toCamelCase(data);
};

export const CHANNEL_UPDATE = (self: BaseClient, data: GatewayChannelUpdateDispatchData) => {
	return channelFrom(data, self);
};
