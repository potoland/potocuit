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
