import {
	ApplicationCommandOptionType,
	type APIApplicationCommandOptionChoice,
	type ChannelType,
} from 'discord-api-types/v10';
import type { AutocompleteCallback, OnAutocompleteErrorCallback, ReturnOptionsTypes, __TypesWrapper } from '..';
import type { CommandContext } from './chatcontext';
import type { MiddlewareContext } from './shared';

type ParagonBasicOption<T extends keyof __TypesWrapper, D = {}> = __TypesWrapper[T] & D;

type ParagonStringOption = ParagonBasicOption<'String'> & {
	autocomplete?: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
	choices?:
	| readonly { readonly name: string; readonly value: string }[]
	| APIApplicationCommandOptionChoice<ReturnOptionsTypes[ApplicationCommandOptionType.String]>[];
	min_length?: number;
	max_length?: number;
};
type ParagonIntegerOption = ParagonBasicOption<'Integer'> & {
	autocomplete?: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
	choices?: APIApplicationCommandOptionChoice<ReturnOptionsTypes[ApplicationCommandOptionType.Integer]>[];
	min_value?: number;
	max_value?: number;
};
type ParagonBooleanOption = ParagonBasicOption<'Boolean'>;
type ParagonUserOption = ParagonBasicOption<'User'>;
type ParagonChannelOption = ParagonBasicOption<'Channel'> & {
	channel_types?: ChannelType[];
};
type ParagonRoleOption = ParagonBasicOption<'Role'>;
type ParagonMentionableOption = ParagonBasicOption<'Mentionable'>;
type ParagonNumberOption = ParagonBasicOption<'Number'> & {
	autocomplete?: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
	choices?: APIApplicationCommandOptionChoice<ReturnOptionsTypes[ApplicationCommandOptionType.Number]>[];
	min_value?: number;
	max_value?: number;
};
type ParagonAttachmentOption = ParagonBasicOption<'Attachment'>;

export function createStringOption<T extends ParagonStringOption = ParagonStringOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.String } as const;
}

export function createIntegerOption<T extends ParagonIntegerOption = ParagonIntegerOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Integer } as const;
}

export function createBooleanOption<T extends ParagonBooleanOption = ParagonBooleanOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Boolean } as const;
}

export function createUserOption<T extends ParagonUserOption = ParagonUserOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.User } as const;
}

export function createChannelOption<T extends ParagonChannelOption = ParagonChannelOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Channel } as const;
}

export function createRoleOption<T extends ParagonRoleOption = ParagonRoleOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Role } as const;
}

export function createMentionableOption<T extends ParagonMentionableOption = ParagonMentionableOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Mentionable } as const;
}

export function createNumberOption<T extends ParagonNumberOption = ParagonNumberOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Number } as const;
}

export function createAttachmentOption<T extends ParagonAttachmentOption = ParagonAttachmentOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Attachment } as const;
}

export type ParseMiddlewareType<T> = T extends MiddlewareContext<any, CommandContext>
	? T
	: MiddlewareContext<T, CommandContext>;

export function createMiddleware<T = ParseMiddlewareType<unknown>>(data: ParseMiddlewareType<T>) {
	return data;
}
