import type { BaseClient } from '../../../client/base';
import { fakePromise, type GatewayIntentBits } from '../../../common';
import type { Cache, ReturnCache } from '../../index';

export class BaseResource<T = any> {
	client!: BaseClient;
	namespace = 'base';

	constructor(
		protected cache: Cache,
		client?: BaseClient,
	) {
		if (client) {
			this.client = client;
		}
	}

	/** @internal */
	__setClient(client: BaseClient) {
		this.client = client;
	}

	get rest() {
		return this.client!.rest;
	}

	get adapter() {
		return this.cache.adapter;
	}

	removeIfNI(intent: keyof typeof GatewayIntentBits, id: string) {
		if (!this.cache.hasIntent(intent)) {
			return this.remove(id)
		}
		return;
	}

	setIfNI(intent: keyof typeof GatewayIntentBits, id: string, data: any) {
		if (!this.cache.hasIntent(intent)) {
			return fakePromise(this.set(id, data)).then(() => data)
		}
	}

	get(id: string): ReturnCache<T | undefined> {
		return this.adapter.get(this.hashId(id));
	}

	set(id: string, data: any) {
		return fakePromise(this.addToRelationship(id))
			.then(() => this.adapter.set(this.hashId(id), data))
	}

	patch<T extends Record<any, any> = Record<any, any>>(id: string, data: T) {
		return fakePromise(this.addToRelationship(id))
			.then(() => this.adapter.patch(false, this.hashId(id), data))
	}

	remove(id: string) {
		return fakePromise(this.removeToRelationship(id))
			.then(() => this.adapter.remove(this.hashId(id)))
	}

	keys(): ReturnCache<string[]> {
		return this.adapter.keys(this.namespace) as string[];
	}

	values(): ReturnCache<T[]> {
		return this.adapter.values(this.namespace) as T[];
	}

	count() {
		return this.adapter.count(this.namespace);
	}

	contains(id: string) {
		return this.adapter.contains(this.namespace, id);
	}

	getToRelationship() {
		return this.adapter.getToRelationship(this.namespace);
	}

	addToRelationship(id: string | string[]) {
		return this.adapter.addToRelationship(this.namespace, id);
	}

	removeToRelationship(id: string | string[]) {
		return this.adapter.removeToRelationship(this.namespace, id);
	}

	hashId(id: string) {
		return `${this.namespace}.${id}`;
	}
}
