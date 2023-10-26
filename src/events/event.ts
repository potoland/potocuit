import { PotocuitEvents } from './hooks';

export interface DeclareEventsOptions {
	name: `${keyof PotocuitEvents}`;
	once?: boolean;
}

export function DeclareEvent(options: DeclareEventsOptions) {
	return function <T extends { new(...args: any[]): {} }>(target: T) {
		return class extends target {
			name = options.name;
			once = options.once ?? false;
			constructor(...args: any[]) {
				super(...args);
				// check if all properties are valid
			}
		};
	};
}

export interface PotoEvent {
	name: `${keyof PotocuitEvents}`;
	once: boolean;
	run(context: EventContext<this>): Promise<any>;
}

export type Handler = {
	[K in keyof PotocuitEvents]: (...args: [PotocuitEvents[K], number]) => unknown;
};

export type EventContext<T extends PotoEvent> = Parameters<Handler[T['name']]>;

// class ReadyEvent implements PotoEvent {
// 	name = 'ready' as const;
// 	once = false;
// 	async run([client, shardId]: EventContext<this>) {
// 		client.username;
// 		return true;
// 	}
// }
