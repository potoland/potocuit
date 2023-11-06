import type { Handler, PotoNameEvents, PotocuitEvent } from './event';
import { PotoHandler } from '../commands/handler';

type OnFailCallback = (error: unknown) => Promise<any>;

export class PotoEventHandler extends PotoHandler {
	protected onFail?: OnFailCallback;

	events: Partial<Record<PotoNameEvents, PotocuitEvent>> = {};

	set OnFail(cb: OnFailCallback) {
		this.onFail = cb;
	}

	// no tocar.
	async load(commandsDir: string) {
		for (const i of await this.loadFiles<PotocuitEvent>(await this.getFiles(commandsDir))) {
			this.events[i.data.name] = i;
		}
	}

	async execute<T extends PotoNameEvents>(name: `${T}`, ...args: Parameters<Handler[T]>) {
		try {
			await this.events[name]?.run(...args);
		} catch (e) {
			await this.onFail?.(e);
		}
	}
}
