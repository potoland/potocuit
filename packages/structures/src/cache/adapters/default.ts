import type { Adapter } from './types';

export class DefaultMemoryAdapter implements Adapter {
	readonly storage = new Map<string, string>;
	readonly relationships = new Map<string, string[]>;

	get(keys: string): any;
	get(keys: string[]): any[];
	get(keys: string | string[]) {
		if (!Array.isArray(keys)) {
			const data = this.storage.get(keys);
			return data ? JSON.parse(data) : null;
		}
		return keys.map(x => {
			const data = this.storage.get(x);
			return data ? JSON.parse(data) : null;
		}).filter(x => x);
	}

	set(keys: string, data: any): void;
	set(keys: [string, any][]): void;
	set(keys: string | [string, any][], data?: any): void {
		if (Array.isArray(keys)) {
			for (const [key, value] of keys) {
				this.storage.set(key, JSON.stringify(value));
			}
		} else {
			this.storage.set(keys, JSON.stringify(data));
		}
	}

	items(to: string) {
		const array: any[] = [];
		const data = this.keys(to);

		for (const key of data) {
			const content = this.get(key);

			if (content) {
				array.push(content);
			}
		}

		return array;
	}

	keys(to: string) {
		return this.getToRelationship(to).map(id => `${to}.${id}`);
	}

	count(to: string) {
		return this.getToRelationship(to).length;
	}

	remove(keys: string): void;
	remove(keys: string[]): void;
	remove(keys: string | string[]) {
		for (const i of Array.isArray(keys) ? keys : [keys]) {
			this.storage.delete(i);
		}
	}

	contains(to: string, keys: string): boolean {
		// contains(to: string, keys: string | string[]): boolean[];
		// contains(to: string, keys: string | string[]) {
		// if (!Array.isArray(keys)) {
		return this.getToRelationship(to).includes(keys);
		// }
		// const relationship = this.getToRelationship(to);
		// return keys.map(x => relationship.includes(x));
	}

	getToRelationship(to: string) {
		return this.relationships.get(to) || [];
	}

	bulkAddToRelationShip(data: Record<string, string[]>) {
		for (const i in data) {
			this.addToRelationship(i, data[i]);
		}
	}

	addToRelationship(to: string, __keys: string | string[]) {
		if (!this.relationships.has(to)) {
			this.relationships.set(to, []);
		}

		const keys = Array.isArray(__keys) ? __keys : [__keys];
		const data = this.getToRelationship(to);

		for (const key of keys) {
			if (data.includes(key)) {
				return;
			}
			data.push(key);
		}
	}

	removeToRelationship(to: string, keys: string | string[]) {
		const data = this.getToRelationship(to);

		if (data) {
			for (const key of keys) {
				const idx = data.indexOf(key);

				if (idx === -1) {
					return;
				}

				data.splice(idx, 1);
			}
		}
	}

	removeRelationship(to: string | string[]) {
		for (const i of Array.isArray(to) ? to : [to]) {
			this.relationships.delete(i);
		}
	}
}
