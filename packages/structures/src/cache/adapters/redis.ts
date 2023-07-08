import { Redis } from 'ioredis';
import type { RedisOptions } from 'ioredis';
import type { Adapter } from './types';

interface Options {
	namespace?: string;
}

export class RedisAdapter implements Adapter {
	client: Redis;
	options: Options = {
		namespace: 'potoland'
	};

	constructor(data: { options?: Options; client: Redis } | { options?: Options; redisOptions: RedisOptions }) {
		this.client = 'client' in data
			? data.client
			: new Redis(data.redisOptions);
		if (data.options) {
			this.options = data.options;
		}
	}

	async get(keys: string[]): Promise<any[]>;
	async get(keys: string): Promise<any>;
	async get(keys: string | string[]) {

		if (!Array.isArray(keys)) {
			const value = await this.client.get(this.build(keys));
			if (value) { return JSON.parse(value); }
			return;
		}

		return (await this.client.mget(...keys.map(x => this.build(x))))
			.filter(x => !!x)
			.map(x => JSON.parse(x!));
	}


	async set(id: [string, any][]): Promise<void>;
	async set(id: string, data: any): Promise<void>;
	async set(id: string | [string, any][], data?: any): Promise<void> {
		if (!Array.isArray(id)) {
			await this.client.set(this.build(id), JSON.stringify(data));
			return;
		}

		const pipeline = this.client.pipeline();

		for (const [k, v] of id) {
			pipeline.set(this.build(k), JSON.stringify(v));
		}

		await pipeline.exec();
	}

	async items(to: string): Promise<any[]> {
		const array: unknown[] = [];
		const data = await this.keys(to);

		if (data.length) {
			const items = await this.client.mget(data);

			for (const item of items) {
				if (item) {
					array.push(JSON.parse(item));
				}
			}
		}

		return array;
	}

	async keys(to: string): Promise<string[]> {
		const data = await this.getToRelationship(to);
		return data.map(id => this.build(`${to}.${id}`));
	}

	async count(to: string): Promise<number> {
		return await this.client.scard(this.build(to));
	}

	async remove(keys: string | string[]): Promise<void> {
		if (!Array.isArray(keys)) {
			await this.client.del(this.build(keys));
			return;
		}

		await this.client.del(...keys.map(x => this.build(x)));
	}

	async contains(to: string, keys: string): Promise<boolean> {
		return await this.client.sismember(this.build(to), keys) === 1;
	}

	async getToRelationship(to: string): Promise<string[]> {
		return await this.client.smembers(this.build(to));
	}

	async bulkAddToRelationShip(data: Record<string, string[]>): Promise<void> {

		const pipeline = this.client.pipeline();

		for (const [key, value] of Object.entries(data)) {
			pipeline.sadd(key, ...value);
			// await this.addToRelationship(key, value);
		}

		await pipeline.exec();
	}

	async addToRelationship(to: string, keys: string | string[]): Promise<void> {
		await this.client.sadd(this.build(to), ...(Array.isArray(keys) ? keys : [keys]));
	}

	async removeToRelationship(to: string, keys: string | string[]): Promise<void> {
		await this.client.srem(this.build(to), ...(Array.isArray(keys) ? keys : [keys]));
	}

	async removeRelationship(to: string | string[]): Promise<void> {
		await this.client.del(...(Array.isArray(to) ? to.map(x => this.build(x)) : [this.build(to)]));
	}

	protected build(id: string) {
		return `${this.options.namespace}:${id}`;
	}
}
