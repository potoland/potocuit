import type { PotoClient, WorkerClient } from '../client';
import { GatewayMessageCreateDispatch, GatewayMessageDeleteBulkDispatch, GatewayMessageDeleteDispatch, PotoHandler, ReplaceRegex, type GatewayDispatchEvents, type GatewayDispatchPayload } from '../common';
import * as RawEvents from '../events/hooks';
import type { PotoNameEvents, PotocuitEvent } from './event';

type OnFailCallback = (error: unknown) => Promise<any>;

type EventValue = PotocuitEvent & { fired?: boolean; __filePath: string };

export class PotoEventHandler extends PotoHandler {
	protected onFail?: OnFailCallback;
	protected filter = (path: string) => path.endsWith('.js');

	values: Partial<Record<GatewayDispatchEvents, EventValue>> = {};

	set OnFail(cb: OnFailCallback) {
		this.onFail = cb;
	}

	async load(eventsDir: string) {
		for (const i of await this.loadFilesK<PotocuitEvent>(await this.getFiles(eventsDir))) {
			const instance = i.file
			//@ts-expect-error
			instance.__filePath = i.path
			this.values[ReplaceRegex.snake(instance.data.name).toUpperCase() as GatewayDispatchEvents] = instance as EventValue
		}
	}

	async execute(name: GatewayDispatchEvents, ...args: [GatewayDispatchPayload, PotoClient | WorkerClient, number]) {
		switch (name) {
			case 'MESSAGE_CREATE': {
				const { d: data } = args[0] as unknown as GatewayMessageCreateDispatch
				if (args[1].components.values.has(data.interaction?.id ?? '')) {
					const value = args[1].components.values.get(data.interaction!.id)!
					args[1].components.values.delete(data.interaction!.id)
					args[1].components.values.set(data.id, value)
				}
			} break
			case 'MESSAGE_DELETE': {
				const { d: data } = args[0] as unknown as GatewayMessageDeleteDispatch
				args[1].components.onMessageDelete(data.id)
			} break
			case 'MESSAGE_DELETE_BULK': {
				const { d: data } = args[0] as unknown as GatewayMessageDeleteBulkDispatch
				data.ids.forEach((id) => args[1].components.onMessageDelete(id));
			} break
		}

		const Event = this.values[name];
		if (!Event) {
			return;
		}
		try {
			if (Event.data.once && Event.fired) {
				return;
			}
			Event.fired = true;
			const hook = await RawEvents[args[0].t]?.(args[1], args[0].d as never);
			await Event.run(...[...(Array.isArray(hook) ? hook : [hook]), args[1], args[2]]);
		} catch (e) {
			await this.onFail?.(e);
		}
	}

	async reload(name: PotoNameEvents) {
		const eventName = ReplaceRegex.snake(name).toUpperCase() as GatewayDispatchEvents;
		const event = this.values[eventName];
		if (!event) return null;
		delete require.cache[event.__filePath];
		const imported = await import(event.__filePath).then(x => new x.default)
		this.values[eventName] = imported
		return imported;
	}
}
