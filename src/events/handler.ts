import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { PotoNameEvents, PotocuitEvent } from './event';

// type Interaction = Extract<GatewayInteractionCreateDispatchData, APIChatInputApplicationCommandInteraction>;

export class PotoHandler {
	protected async getFiles(dir: string) {
		const files: string[] = [];

		for (const i of await readdir(dir, { withFileTypes: true })) {
			if (i.isDirectory()) {
				files.push(...await this.getFiles(join(dir, i.name)));
			} else { files.push(join(dir, i.name)); }
		}

		return files;
	}

	// imagina tener autocompletado putovsc web
	protected async loadFiles<T extends NonNullable<unknown>>(paths: string[]): Promise<T[]> {
		return await Promise.all(paths.map(path => import(path).then(file => file.default ?? file)));
	}
}

export class PotoEventHandler extends PotoHandler {
	events: Partial<Record<PotoNameEvents, PotocuitEvent>> = {};

	// no tocar.
	async loadEvents(commandsDir: string) {
		for (const i of await this.loadFiles<PotocuitEvent>(await this.getFiles(commandsDir))) {
			this.events[i.data.name] = i;
		}
	}
}
