import { GatewayIntentBits } from "@biscuitland/common";
import type { InternalRuntimeConfig, InternalRuntimeConfigHTTP, RuntimeConfig, RuntimeConfigHTTP } from "./client/base";
import type { MiddlewareContext, __PotoCommandOption } from "./commands";
import type { EventContext, IClientEvents, PotoNameEvents } from "./events";
import { ChatInputCommandInteraction } from "./structures";

export * from "./cache";
export * from "./client";
export * from "./commands";
export * from "./components";
export * from "./events";
export * from "./structures";
export * from "./structures/extra/functions";
export * from "./types";
export * from "./websocket/discord/workermanager";

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

export function createEvent<K extends keyof IClientEvents, E extends PotoNameEvents>(data: {
	data: { name: E; once: boolean };
	run: (...args: EventContext<K, { data: { name: E } }>) => any;
}) {
	return data;
}

export const config = {
	bot(data: RuntimeConfig) {
		return {
			...data,
			intents:
				"intents" in data
					? typeof data.intents === "number"
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

export function extendContext<T extends {}>(cb: (interaction: ChatInputCommandInteraction) => T) {
	return cb
}
