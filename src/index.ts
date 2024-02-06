import type { InternalRuntimeConfig, InternalRuntimeConfigHTTP, RuntimeConfig, RuntimeConfigHTTP } from './client/base';
import { GatewayIntentBits } from './common';
import type { ClientNameEvents, EventContext } from './events';
import type { ChatInputCommandInteraction, MessageCommandInteraction, UserCommandInteraction } from './structures';

export * from './client';
export * from './commands';
export { ComponentCommand, ComponentsListener, ModalCommand } from './components';
export type { ParseLocales } from './langs';
export { ShardManager, WorkerManager } from './websocket/discord';

export function throwError(msg: string): never {
	throw new Error(msg);
}

export function createEvent<E extends ClientNameEvents>(data: {
	data: { name: E; once?: boolean };
	run: (...args: EventContext<{ data: { name: E } }>) => any;
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
