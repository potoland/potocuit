import type { PotocuitEvent } from './event';
import { PotoHandler } from '../commands/handler';
import type { PotoClient } from '../client';
import * as RawEvents from '../events/hooks/index';
import { ReplaceRegex, type GatewayDispatchEvents, type GatewayDispatchPayload } from '@biscuitland/common';

type OnFailCallback = (error: unknown) => Promise<any>;

export class PotoEventHandler extends PotoHandler {
	protected onFail?: OnFailCallback;

	events: Partial<Record<GatewayDispatchEvents, PotocuitEvent & { fired?: boolean }>> = {};

	set OnFail(cb: OnFailCallback) {
		this.onFail = cb;
	}

	async load(commandsDir: string) {
		for (const i of await this.loadFiles<PotocuitEvent>(await this.getFiles(commandsDir))) {
			this.events[ReplaceRegex.snake(i.data.name).toUpperCase() as GatewayDispatchEvents] = i;
		}
	}

	async execute(name: GatewayDispatchEvents, ...args: [GatewayDispatchPayload, PotoClient, number]) {
		const Event = this.events[name];
		if (!Event) { return; }
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
