import type { InternalRuntimeConfig, InternalRuntimeConfigHTTP, RuntimeConfig, RuntimeConfigHTTP } from './client/base';
import type {
	AutocompleteCallback,
	CommandContext,
	OnAutocompleteErrorCallback,
	ReturnOptionsTypes,
	__TypesWrapper,
} from './commands';
import { MiddlewareContext } from './commands/applications/shared';
import {
	APIApplicationCommandOptionChoice,
	ApplicationCommandOptionType,
	ChannelType,
	GatewayIntentBits,
} from './common';
import type { EventContext, IClientEvents, PotoNameEvents } from './events';
import { ChatInputCommandInteraction, MessageCommandInteraction, UserCommandInteraction } from './structures';

export * from './api';
export * from './builders';
export * from './cache';
export * from './client';
export * from './collection';
export * from './commands';
export * from './common';
export * from './components';
export * from './events';
export * from './structures';
export * from './structures/extra/functions';
export * from './websocket/discord/workermanager';

export function throwError(msg: string): never {
	throw new Error(msg);
}

// ts trickers
// export function createOption<T extends __PotoCommandOption = __PotoCommandOption>(data: T) {
// 	return data;
// }

// createOption({
// 	type: ApplicationCommandOptionType.String,
// 	value(ctx) {
// 		return ctx
// 	},
// 	description: ''
// })

type BiscuitBasicOption<T extends keyof __TypesWrapper, D = {}> = __TypesWrapper[T] & D;

type BiscuitStringOption = BiscuitBasicOption<'String'> & {
	autocomplete?: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
	choices?: APIApplicationCommandOptionChoice<ReturnOptionsTypes[ApplicationCommandOptionType.String]>[];
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

export function createMiddleware<M, T = MiddlewareContext<M, CommandContext<'base'>>>(data: T) {
	return data;
}

export function createEvent<K extends keyof IClientEvents, E extends PotoNameEvents>(data: {
	data: { name: E; once?: boolean };
	run: (...args: EventContext<K, { data: { name: E } }>) => any;
}) {
	data.data.once ??= false;
	return data;
}

export const config = {
	bot(data: RuntimeConfig) {
		return {
			...data,
			intents:
				'intents' in data
					? typeof data.intents === 'number'
						? data.intents
						: data.intents?.reduce((pr, acc) => pr | GatewayIntentBits[acc], 0) ?? 0
					: 0,
		} as InternalRuntimeConfig;
	},
	http(data: RuntimeConfigHTTP) {
		return {
			port: 8080,
			...data,
		} as InternalRuntimeConfigHTTP;
	},
};

export function extendContext<T extends {}>(
	cb: (interaction: ChatInputCommandInteraction | UserCommandInteraction | MessageCommandInteraction) => T,
) {
	return cb;
}
