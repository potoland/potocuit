import type { InternalRuntimeConfig, InternalRuntimeConfigHTTP, RuntimeConfig, RuntimeConfigHTTP } from './client/base';
import { GatewayIntentBits } from './common';
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
