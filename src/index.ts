import type { InternalRuntimeConfig, InternalRuntimeConfigHTTP, RuntimeConfig, RuntimeConfigHTTP } from './client/base';
import { GatewayIntentBits } from './common';
import type { ClientNameEvents, EventContext } from './events';
import type { ChatInputCommandInteraction, MessageCommandInteraction, UserCommandInteraction } from './structures';

export * from './api';
export * from './builders';
export * from './client';
export * from './commands';
export { Logger, Watcher } from './common';
export { ComponentCommand, ComponentsListener, ModalCommand } from './components';
export type { ParseLocales } from './langs';
export * from './structures';
export { ShardManager, WorkerManager } from './websocket/discord';

export function throwError(msg: string): never {
	throw new Error(msg);
}

/**
 * Creates an event with the specified data and run function.
 *
 * @param data - The event data.
 * @returns The created event.
 *
 * @example
 * const myEvent = createEvent({
 *   data: { name: 'ready', once: true },
 *   run: (user, client, shard) => {
 *     client.logger.info(`Start ${user.username} on shard #${shard}`);
 *   }
 * });
 */
export function createEvent<E extends ClientNameEvents>(data: {
	data: { name: E; once?: boolean };
	run: (...args: EventContext<{ data: { name: E } }>) => any;
}) {
	data.data.once ??= false;
	return data;
}

export const config = {
	/**
	 * Configurations for the bot.
	 *
	 * @param data - The runtime configuration data for gateway connections.
	 * @returns The internal runtime configuration.
	 */
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
	/**
	 * Configurations for the HTTP server.
	 *
	 * @param data - The runtime configuration data for http server.
	 * @returns The internal runtime configuration for HTTP.
	 */
	http(data: RuntimeConfigHTTP) {
		return {
			port: 8080,
			...data,
		} as InternalRuntimeConfigHTTP;
	},
};

/**
 * Extends the context of a command interaction.
 *
 * @param cb - The callback function to extend the context.
 * @returns The extended context.
 *
 * @example
 * const customContext = extendContext((interaction) => {
 * 	return {
 * 		owner: '123456789012345678',
 * 		// Add your custom properties here
 * 	};
 * });
 */
export function extendContext<T extends {}>(
	cb: (interaction: ChatInputCommandInteraction | UserCommandInteraction | MessageCommandInteraction) => T,
) {
	return cb;
}
