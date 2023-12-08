import type { PotoNameEvents, PotocuitEvent } from './event';
import { PotoHandler } from '../commands/handler';
import type { PotoClient } from '../client';
import * as RawEvents from '../events/hooks/index';
import type { GatewayDispatchPayload } from '@biscuitland/common';

type OnFailCallback = (error: unknown) => Promise<any>;

export class PotoEventHandler extends PotoHandler {
	protected onFail?: OnFailCallback;

	events: Partial<Record<PotoNameEvents, PotocuitEvent>> = {};

	set OnFail(cb: OnFailCallback) {
		this.onFail = cb;
	}

	async load(commandsDir: string) {
		for (const i of await this.loadFiles<PotocuitEvent>(await this.getFiles(commandsDir))) {
			this.events[i.data.name] = i;
		}
	}

	async execute<T extends PotoNameEvents>(name: `${T}`, ...args: [GatewayDispatchPayload, PotoClient, number]) {
		try {
			if (this.events[name]) {
				await this.events[name]!.run(...[RawEvents[args[0].t]?.(args[1], args[0].d as never), args[1], args[2]]);
			}
		} catch (e) {
			await this.onFail?.(e);
		} finally {
			if (this.events[name]?.data.once) {
				delete this.events[name];
			}
		}
	}
}
