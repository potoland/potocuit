import 'module-alias/register';

import { GatewayIntentBits } from '@biscuitland/common';
import type { InternalRuntimeConfigHTTP, InternalRuntimeConfig, RuntimeConfig, RuntimeConfigHTTP } from './client/base';
import type { MiddlewareContext, __PotoCommandOption } from './commands';
import type { PotoNameEvents, EventContext } from './events';

export * from './types';
export * from './cache';
export * from './structures/extra/functions';
export * from './commands';
export * from './client';
export * from './types';
export * from './cache';
export * from './commands';
export * from './events';
export * from './components';
export * from './structures';

export function throwError(msg: string): never {
	throw new Error(msg);
}

// ts trickers
export function createOption<T extends __PotoCommandOption = __PotoCommandOption>(data: T) {
	return data;
}

export function createMiddleware<M, T = MiddlewareContext<M>>(data: T) {
	return data;
}

export function createEvent<E extends PotoNameEvents>(data: {
	data: { name: E; once: boolean };
	run: (...args: EventContext<{ data: { name: E } }>) => any;
}) {
	return data;
}

export const config = {
	bot(data: RuntimeConfig) {
		return {
			...data,
			intents: 'intents' in data ? data.intents?.reduce((pr, acc) => pr | GatewayIntentBits[acc], 0) ?? 0 : 0,
		} as InternalRuntimeConfig;
	},
	http(data: RuntimeConfigHTTP) {
		return {
			port: 8080,
			...data,
		} as InternalRuntimeConfigHTTP;
	}
};
