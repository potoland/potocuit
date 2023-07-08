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
import type { BiscuitREST } from '@biscuitland/rest';

import type { PartialClass } from '.';

import { type Cache, Message } from '@potoland/structures';

import { toCamelCase } from '@biscuitland/common';

export const MESSAGE_CREATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayMessageCreateDispatchData
) => {
	return new Message(rest, cache, data);
};

export const MESSAGE_DELETE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayMessageDeleteDispatchData
) => {
	return toCamelCase(data);
};

export const MESSAGE_DELETE_BULK = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayMessageDeleteBulkDispatchData
) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_ADD = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayMessageReactionAddDispatchData
) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayMessageReactionRemoveDispatchData
) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE_ALL = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayMessageReactionRemoveAllDispatchData
) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE_EMOJI = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayMessageReactionRemoveEmojiDispatchData
) => {
	return toCamelCase(data);
};

export const MESSAGE_UPDATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayMessageUpdateDispatchData
): PartialClass<Message> => {
	return new Message(rest, cache, data as unknown as APIMessage);
};
