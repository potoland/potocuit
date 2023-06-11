import type { CamelCase } from '@biscuitland/common';
import type * as RawEvents from './events';

export type PotocuitEvents = {
	[X in keyof typeof RawEvents as CamelCase<X>]: [ReturnType<typeof RawEvents[X]>]
};

export * from './potocuit.js';
