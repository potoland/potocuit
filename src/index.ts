import type { MiddlewareContext, __PotoCommandOption } from './commands';

export * from './types';
export * from './cache';
export * from './structures/extra/functions';
export * from './commands';
export * from './client';
export * from './types';
export * from './cache';
export * from './structures/extra/functions';
export * from './commands';
export * from './events';

export function throwError(msg: string): never {
	throw new Error(msg);
}

export function createOption<T = __PotoCommandOption>(data: T) {
	return data;
}

export function createMiddleware<M, T = MiddlewareContext<M>>(data: T) {
	return data;
}
