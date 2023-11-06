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
	[K in keyof PotocuitEvents]: (...data: [PotocuitEvents[K], number, PotoClient]) => unknown;
};
export type EventContext<T extends PotocuitEvent> = Parameters<Handler[T['data']['name']]>;
export interface PotocuitEvent {
	data: PotocuitDataEvent;
	run(...args: EventContext<any>): any;
}


// // xdxdxdxdxdx
// // xd
// const xddd: PotoNameEvents = 'ready'; // CUAL ES LA MALDITA DIFERENCIA
// xddd;
// // ^?

// class ReadyEvent implements PotocuitEvent {
// 	data = {
// 		name: 'guildBanAdd',
// 		once: true
// 	} satisfies PotocuitDataEvent;

// 	// data = declareEvent();
// 	async run([ctx, shardId]: EventContext<this>): Promise<any> {
// 		this
// 			.data;
// 		// ^?
// 		shardId;
// 		ctx
// 			.guildId;
// 		// ^?
// 	}
// }
// // xd?
// // callate
// // wtf usas as const y se arregla, quien lo diriaxd
