import {
	toCamelCase,
	type GatewayChannelCreateDispatchData,
	type GatewayChannelDeleteDispatchData,
	type GatewayChannelPinsUpdateDispatchData,
	type GatewayChannelUpdateDispatchData,
} from '@biscuitland/common';

import { BaseChannel } from '../../structures/methods/channel/base';
import type { BaseClient } from '../../client/base';

export const CHANNEL_CREATE = (
	self: BaseClient,
	data: GatewayChannelCreateDispatchData
) => {
	return BaseChannel.from(data, self);
};

export const CHANNEL_DELETE = (
	self: BaseClient,
	data: GatewayChannelDeleteDispatchData
) => {
	return BaseChannel.from(data, self);
};

export const CHANNEL_PINS_UPDATE = (
	_self: BaseClient,
	data: GatewayChannelPinsUpdateDispatchData
) => {
	return toCamelCase(data);
};

export const CHANNEL_UPDATE = (
	self: BaseClient,
	data: GatewayChannelUpdateDispatchData
) => {
	return BaseChannel.from(data, self);
};
