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
import { toCamelCase } from '@biscuitland/common';
import type { PartialClass } from '.';
import type { BaseClient } from '../../client/base';
import { Message } from '../../structures';

export const MESSAGE_CREATE = (self: BaseClient, data: GatewayMessageCreateDispatchData) => {
	return new Message(self, data);
};

export const MESSAGE_DELETE = (self: BaseClient, data: GatewayMessageDeleteDispatchData) => {
	self.components.onMessageDelete(data.id);
	return toCamelCase(data);
};

export const MESSAGE_DELETE_BULK = (self: BaseClient, data: GatewayMessageDeleteBulkDispatchData) => {
	data.ids.forEach((id) => self.components.onMessageDelete(id));
	return toCamelCase(data);
};

export const MESSAGE_REACTION_ADD = (_self: BaseClient, data: GatewayMessageReactionAddDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE = (_self: BaseClient, data: GatewayMessageReactionRemoveDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE_ALL = (_self: BaseClient, data: GatewayMessageReactionRemoveAllDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE_EMOJI = (
	_self: BaseClient,
	data: GatewayMessageReactionRemoveEmojiDispatchData,
) => {
	return toCamelCase(data);
};

export const MESSAGE_UPDATE = (self: BaseClient, data: GatewayMessageUpdateDispatchData): PartialClass<Message> => {
	return new Message(self, data as unknown as APIMessage);
};
