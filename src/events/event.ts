import type { PotoClient } from '../client';
import type { PotocuitEvents } from './hooks';

export interface DeclareEventsOptions {
	name: `${keyof PotocuitEvents}`;
	once?: boolean;
}
export type PotoNameEvents = Extract<keyof PotocuitEvents, string>;

export interface PotocuitDataEvent {
	name: PotoNameEvents;
	once: boolean;
}
export type Handler = {
	[K in keyof PotocuitEvents]: (...data: [PotocuitEvents[K], PotoClient, number]) => unknown;
};
export type EventContext<T extends { data: { name: PotoNameEvents } }> = Parameters<Handler[T['data']['name']]>;
export interface PotocuitEvent {
	data: PotocuitDataEvent;
	run(...args: EventContext<any>): any;
}
