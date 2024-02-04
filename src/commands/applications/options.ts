import {
	ApplicationCommandOptionType,
	type APIApplicationCommandOptionChoice,
	type ChannelType,
} from 'discord-api-types/v10';
import type { AutocompleteCallback, OnAutocompleteErrorCallback, ReturnOptionsTypes, __TypesWrapper } from '..';
import type { IClients } from '../../client';
import type { CommandContext } from './chatcontext';
import type { MiddlewareContext } from './shared';

type BiscuitBasicOption<T extends keyof __TypesWrapper, D = {}> = __TypesWrapper[T] & D;

type BiscuitStringOption = BiscuitBasicOption<'String'> & {
	autocomplete?: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
	choices?:
		| readonly { readonly name: string; readonly value: string }[]
		| APIApplicationCommandOptionChoice<ReturnOptionsTypes[ApplicationCommandOptionType.String]>[];
	min_length?: number;
	max_length?: number;
};
type BiscuitIntegerOption = BiscuitBasicOption<'Integer'> & {
	autocomplete?: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
	choices?: APIApplicationCommandOptionChoice<ReturnOptionsTypes[ApplicationCommandOptionType.Integer]>[];
	min_value?: number;
	max_value?: number;
};
type BiscuitBooleanOption = BiscuitBasicOption<'Boolean'>;
type BiscuitUserOption = BiscuitBasicOption<'User'>;
type BiscuitChannelOption = BiscuitBasicOption<'Channel'> & {
	channel_types?: ChannelType[];
};
type BiscuitRoleOption = BiscuitBasicOption<'Role'>;
type BiscuitMentionableOption = BiscuitBasicOption<'Mentionable'>;
type BiscuitNumberOption = BiscuitBasicOption<'Number'> & {
	autocomplete?: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
	choices?: APIApplicationCommandOptionChoice<ReturnOptionsTypes[ApplicationCommandOptionType.Number]>[];
	min_value?: number;
	max_value?: number;
};
type BiscuitAttachmentOption = BiscuitBasicOption<'Attachment'>;

export function createStringOption<T extends BiscuitStringOption = BiscuitStringOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.String } as const;
}

export function createIntegerOption<T extends BiscuitIntegerOption = BiscuitIntegerOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Integer } as const;
}

export function createBooleanOption<T extends BiscuitBooleanOption = BiscuitBooleanOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Boolean } as const;
}

export function createUserOption<T extends BiscuitUserOption = BiscuitUserOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.User } as const;
}

export function createChannelOption<T extends BiscuitChannelOption = BiscuitChannelOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Channel } as const;
}

export function createRoleOption<T extends BiscuitRoleOption = BiscuitRoleOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Role } as const;
}

export function createMentionableOption<T extends BiscuitMentionableOption = BiscuitMentionableOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Mentionable } as const;
}

export function createNumberOption<T extends BiscuitNumberOption = BiscuitNumberOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Number } as const;
}

export function createAttachmentOption<T extends BiscuitAttachmentOption = BiscuitAttachmentOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Attachment } as const;
}

export type ParseMiddlewareType<T> = T extends MiddlewareContext<any, CommandContext<keyof IClients>>
	? T
	: MiddlewareContext<T, CommandContext<keyof IClients>>;

export function createMiddleware<T = ParseMiddlewareType<unknown>>(data: ParseMiddlewareType<T>) {
	return data;
}
