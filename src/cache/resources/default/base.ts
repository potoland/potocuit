import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../../index';
import { GatewayIntentBits } from '@biscuitland/common';

export class BaseResource<T = any> {
	namespace = 'base';

	constructor(protected rest: BiscuitREST, protected cache: Cache) {
	}

	get adapter() {
		return this.cache.adapter;
	}

	async removeIfNI(intent: keyof typeof GatewayIntentBits, id: string) {
		if (!this.cache.hasIntent(intent)) {
			await this.remove(id);
		}
	}

	async setIfNI(intent: keyof typeof GatewayIntentBits, id: string, data: any) {
		if (!this.cache.hasIntent(intent)) {
			await this.set(id, data);
		}
	}

	async get(id: string): Promise<T | undefined> {
		return await this.adapter.get(this.hashId(id));
	}

	async set(id: string, data: any) {
		await this.addToRelationship(id);
		await this.adapter.set(this.hashId(id), data);
	}

	async patch<R extends any = any, T extends Record<any, any> = Record<any, any>>(id: string, data: T): Promise<R> {
		const old = await this.get(id) ?? {};
		const patch = { ...old, ...data };
		await this.set(id, patch);
		return patch;
	}

	async remove(id: string) {
		await this.removeToRelationship(id);
		await this.adapter.remove(this.hashId(id));
	}

	async keys(): Promise<string[]> {
		return await this.adapter.keys(this.namespace);
	}

	async values(): Promise<T[]> {
		return await this.adapter.values(this.namespace);
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
