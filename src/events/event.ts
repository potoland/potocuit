import { UsingClient } from '../commands';
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

export type Handler = {
	[K in keyof ClientEvents]: (...data: [Awaited<ClientEvents[K]>, UsingClient, number]) => unknown;
};
export type EventContext<T extends { data: { name: ClientNameEvents } }> = Parameters<
	Handler[T['data']['name']]
>;
export interface ClientEvent {
	data: ClientDataEvent;
	run(...args: EventContext<any>): any;
	/**@internal */
	__filePath?: string;
}
