import { GatewayIntentBits, Options } from '@biscuitland/common';
import { DefaultVars, type Variables } from './client/base';
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
export * from './Components';

export function throwError(msg: string): never {
	throw new Error(msg);
}

// ts trickers
export function createOption<T = __PotoCommandOption>(data: T) {
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

export function env(data: Omit<Variables, 'intents'> & { intents: (keyof typeof GatewayIntentBits)[] }): Required<Variables> {
	return Options(
		DefaultVars,
		{
			...data,
			intents: data.intents.reduce((pr, acc) => pr | GatewayIntentBits[acc], 0),
		}
	);
}
