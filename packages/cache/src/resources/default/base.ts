import type { Cache } from '../../index';

export class BaseResource<T = any> {
	namespace = 'base';
	protected cache: Cache;

	constructor(cache: Cache) {
		this.cache = cache;
	}

	get adapter() {
		return this.cache.adapter;
	}

	async get(id: string): Promise<T | undefined> {
		return await this.adapter.get(this.hashId(id));
	}

	async set(id: string, data: any) {
		await this.addToRelationship(id);
		await this.adapter.set(this.hashId(id), data);
	}

	async remove(id: string) {
		await this.removeToRelationship(id);
		await this.adapter.remove(this.hashId(id));
	}

	async keys(options?: any): Promise<string[]> {
		return await this.adapter.keys(this.namespace, options);
	}

	async items(options?: any): Promise<T[]> {
		return await this.adapter.items(this.namespace, options);
	}

	async count() {
		return await this.adapter.count(this.namespace);
	}

	async contains(id: string) {
		return await this.adapter.contains(this.namespace, id);
	}

	async getToRelationship() {
		return await this.adapter.getToRelationship(this.namespace);
	}

	async addToRelationship(id: string | string[]) {
		await this.adapter.addToRelationship(this.namespace, id);
	}

	async removeToRelationship(id: string | string[]) {
		await this.adapter.removeToRelationship(this.namespace, id);
	}

	hashId(id: string) {
		return `${this.namespace}.${id}`;
	}
}
