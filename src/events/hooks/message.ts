import type {
	APIMessage,
	GatewayMessageCreateDispatchData,
	GatewayMessageDeleteBulkDispatchData,
	GatewayMessageDeleteDispatchData,
	GatewayMessageReactionAddDispatchData,
	GatewayMessageReactionRemoveAllDispatchData,
	GatewayMessageReactionRemoveDispatchData,
	GatewayMessageReactionRemoveEmojiDispatchData,
	GatewayMessageUpdateDispatchData,
} from '@biscuitland/common';
import type { PartialClass } from '.';
import type { BaseClient } from '../../client/base';
import { toCamelCase } from '@biscuitland/common';
import { Message } from '../../structures';

export const MESSAGE_CREATE = (
	self: BaseClient,
	data: GatewayMessageCreateDispatchData
) => {
	return new Message(self.rest, self.cache, data);
};

export const MESSAGE_DELETE = (
	_self: BaseClient,
	data: GatewayMessageDeleteDispatchData
) => {
	return toCamelCase(data);
};

export const MESSAGE_DELETE_BULK = (
	_self: BaseClient,
	data: GatewayMessageDeleteBulkDispatchData
) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_ADD = (
	_self: BaseClient,
	data: GatewayMessageReactionAddDispatchData
) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE = (
	_self: BaseClient,
	data: GatewayMessageReactionRemoveDispatchData
) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE_ALL = (
	_self: BaseClient,
	data: GatewayMessageReactionRemoveAllDispatchData
) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE_EMOJI = (
	_self: BaseClient,
	data: GatewayMessageReactionRemoveEmojiDispatchData
) => {
	return toCamelCase(data);
};

export const MESSAGE_UPDATE = (
	self: BaseClient,
	data: GatewayMessageUpdateDispatchData
): PartialClass<Message> => {
	return new Message(self.rest, self.cache, data as unknown as APIMessage);
};
