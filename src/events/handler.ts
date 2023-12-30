import type { PotoClient, WorkerClient } from '../client';
import { PotoHandler, ReplaceRegex, type GatewayDispatchEvents, type GatewayDispatchPayload } from '../common';
import * as RawEvents from '../events/hooks';
import type { PotocuitEvent } from './event';

type OnFailCallback = (error: unknown) => Promise<any>;

export class PotoEventHandler extends PotoHandler {
	protected onFail?: OnFailCallback;
	protected filter = (path: string) => path.endsWith('.js');

	values: Partial<Record<GatewayDispatchEvents, PotocuitEvent & { fired?: boolean }>> = {};

	set OnFail(cb: OnFailCallback) {
		this.onFail = cb;
	}

	async load(commandsDir: string) {
		for (const i of await this.loadFiles<PotocuitEvent>(await this.getFiles(commandsDir))) {
			this.values[ReplaceRegex.snake(i.data.name).toUpperCase() as GatewayDispatchEvents] = i;
		}
	}

	async execute(name: GatewayDispatchEvents, ...args: [GatewayDispatchPayload, PotoClient | WorkerClient, number]) {
		const Event = this.values[name];
		if (!Event) {
			return;
		}
		try {
			if (Event.data.once && Event.fired) {
				return;
			}
			Event.fired = true;
			await Event.run(...[RawEvents[args[0].t]?.(args[1], args[0].d as never), args[1], args[2]]);
		} catch (e) {
			await this.onFail?.(e);
		}
	}
}
