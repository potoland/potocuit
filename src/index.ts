import type { MiddlewareContext, PotoCommandOption } from './commands';

export * from './types';
export * from './cache';
export * from './structures/extra/functions';
export * from './commands';
export * from './client';
export * from './types';
export * from './cache';
export * from './structures/extra/functions';
export * from './commands';

export function throwError(msg: string): never {
	throw new Error(msg);
}

export function createOption<T = PotoCommandOption>(data: T) {
	return data;
}

export function createMiddleware<M, T = MiddlewareContext<M>>(data: T) {
	return data;
}
