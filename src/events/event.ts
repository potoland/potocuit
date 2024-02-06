import type { Client, WorkerClient } from '../client';
import type { ClientEvents } from './hooks';

export interface DeclareEventsOptions {
	name: `${keyof ClientEvents}`;
	once?: boolean;
}
export type ClientNameEvents = Extract<keyof ClientEvents, string>;

export interface ClientDataEvent {
	name: ClientNameEvents;
	once: boolean;
}

export interface IClientEvents {
	client: Client;
	worker: WorkerClient;
}

export type Handler<T extends Client | WorkerClient> = {
	[K in keyof ClientEvents]: (...data: [Awaited<ClientEvents[K]>, T, number]) => unknown;
};
export type EventContext<K extends keyof IClientEvents, T extends { data: { name: ClientNameEvents } }> = Parameters<
	Handler<IClientEvents[K]>[T['data']['name']]
>;
export interface ClientEvent {
	data: ClientDataEvent;
	run(...args: EventContext<any, any>): any;
	/**@internal */
	__filePath?: string
}
