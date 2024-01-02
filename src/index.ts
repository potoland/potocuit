import type { InternalRuntimeConfig, InternalRuntimeConfigHTTP, RuntimeConfig, RuntimeConfigHTTP } from './client/base';
import type { CommandContext, __PotoCommandOption } from './commands';
import { MiddlewareContext } from './commands/applications/shared';
import { GatewayIntentBits } from './common';
import type { EventContext, IClientEvents, PotoNameEvents } from './events';
import { ChatInputCommandInteraction, MessageCommandInteraction, UserCommandInteraction } from './structures';

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
export * from './api';

export function throwError(msg: string): never {
	throw new Error(msg);
}

// ts trickers
export function createOption<T extends __PotoCommandOption = __PotoCommandOption>(data: T) {
	return data;
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
