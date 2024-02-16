import type { RedisOptions } from 'ioredis';
import { Redis } from 'ioredis';
import { fastFlat } from '../../common';
import type { Adapter } from './types';

interface RedisAdapterOptions {
	namespace?: string;
}

export class RedisAdapter implements Adapter {
	client: Redis;
	namespace: string;

	constructor(data: ({ client: Redis } | { redisOptions: RedisOptions }) & RedisAdapterOptions) {
		this.client = 'client' in data ? data.client : new Redis(data.redisOptions);
		this.namespace = data.namespace ?? 'paragonjs';
	}

	scan(query: string, returnKeys?: false): Promise<any[]>;
	scan(query: string, returnKeys: true): Promise<string[]>;
	scan(query: string, returnKeys = false) {
		const match = this.buildKey(query);
		return new Promise<string[]>((r, j) => {
			const stream = this.client.scanStream({
				match,
				// omit relationships
				type: 'hash',
			});
			const keys: string[] = [];
			stream
				.on('data', resultKeys => keys.push(...resultKeys))
				.on('end', () => (returnKeys ? r(keys.map(x => this.buildKey(x))) : r(this.get(keys))))
				.on('error', err => j(err));
		});
	}

	async get(keys: string[]): Promise<any[]>;
	async get(keys: string): Promise<any>;
	async get(keys: string | string[]) {
		if (!Array.isArray(keys)) {
			const value = await this.client.hgetall(this.buildKey(keys));
			if (value) {
				return toNormal(value);
			}
			return;
		}

		const pipeline = this.client.pipeline();

		for (const key of keys) {
			pipeline.hgetall(this.buildKey(key));
		}

		return (await pipeline.exec())?.filter(x => !!x[1]).map(x => toNormal(x[1] as Record<string, any>)) ?? [];
	}

	async set(id: [string, any][]): Promise<void>;
	async set(id: string, data: any): Promise<void>;
	async set(id: string | [string, any][], data?: any): Promise<void> {
		if (!Array.isArray(id)) {
			await this.client.hset(this.buildKey(id), toDb(data));
			return;
		}

		const pipeline = this.client.pipeline();

		for (const [k, v] of id) {
			pipeline.hset(this.buildKey(k), toDb(v));
		}

		await pipeline.exec();
	}

	async patch(updateOnly: boolean, id: [string, any][]): Promise<void>;
	async patch(updateOnly: boolean, id: string, data: any): Promise<void>;
	async patch(updateOnly: boolean, id: string | [string, any][], data?: any): Promise<void> {
		if (!Array.isArray(id)) {
			if (updateOnly) {
				await this.client.eval(
					`if redis.call('exists',KEYS[1]) == 1 then redis.call('hset', KEYS[1], ${Array.from(
						{ length: Object.keys(data).length * 2 },
						(_, i) => `ARGV[${i + 1}]`,
					)}) end`,
					1,
					this.buildKey(id),
					...fastFlat(Object.entries(toDb(data))),
				);
			} else {
				await this.client.hset(this.buildKey(id), toDb(data));
			}
			return;
		}

		const pipeline = this.client.pipeline();

		for (const [k, v] of id) {
			if (updateOnly) {
				pipeline.eval(
					`if redis.call('exists',KEYS[1]) == 1 then redis.call('hset', KEYS[1], ${Array.from(
						{ length: Object.keys(v).length * 2 },
						(_, i) => `ARGV[${i + 1}]`,
					)}) end`,
					1,
					this.buildKey(k),
					...fastFlat(Object.entries(toDb(v))),
				);
			} else {
				pipeline.hset(this.buildKey(k), toDb(v));
			}
		}

		await pipeline.exec();
	}

	async values(to: string): Promise<any[]> {
		const array: unknown[] = [];
		const data = await this.keys(to);
		if (data.length) {
			const items = await this.get(data);
			for (const item of items) {
				if (item) {
					array.push(item);
				}
			}
		}

		return array;
	}

	async keys(to: string): Promise<string[]> {
		const data = await this.getToRelationship(to);
		return data.map(id => this.buildKey(`${to}.${id}`));
	}

	async count(to: string): Promise<number> {
		return this.client.scard(`${this.buildKey(to)}:set`);
	}

	async remove(keys: string | string[]): Promise<void> {
		if (!Array.isArray(keys)) {
			await this.client.del(this.buildKey(keys));
			return;
		}

		await this.client.del(...keys.map(x => this.buildKey(x)));
	}

	async contains(to: string, keys: string): Promise<boolean> {
		return (await this.client.sismember(`${this.buildKey(to)}:set`, keys)) === 1;
	}

	async getToRelationship(to: string): Promise<string[]> {
		return this.client.smembers(`${this.buildKey(to)}:set`);
	}

	async bulkAddToRelationShip(data: Record<string, string[]>): Promise<void> {
		const pipeline = this.client.pipeline();

		for (const [key, value] of Object.entries(data)) {
			pipeline.sadd(`${this.buildKey(key)}:set`, ...value);
		}

		await pipeline.exec();
	}

	async addToRelationship(to: string, keys: string | string[]): Promise<void> {
		await this.client.sadd(`${this.buildKey(to)}:set`, ...(Array.isArray(keys) ? keys : [keys]));
	}

	async removeToRelationship(to: string, keys: string | string[]): Promise<void> {
		await this.client.srem(`${this.buildKey(to)}:set`, ...(Array.isArray(keys) ? keys : [keys]));
	}

	async removeRelationship(to: string | string[]): Promise<void> {
		await this.client.del(
			...(Array.isArray(to) ? to.map(x => `${this.buildKey(x)}:set`) : [`${this.buildKey(to)}:set`]),
		);
	}

	protected buildKey(key: string) {
		return key.startsWith(this.namespace) ? key : `${this.namespace}:${key}`;
	}
}

const isObject = (o: unknown) => {
	return !!o && typeof o === 'object' && !Array.isArray(o);
};

function toNormal(target: Record<string, any>) {
	const result: Record<string, any> = {};
	for (const [key, value] of Object.entries(target)) {
		if (key.startsWith('O_')) {
			result[key.slice(2)] = JSON.parse(value);
		} else if (key.startsWith('N_')) {
			result[key.slice(2)] = Number(value);
		} else if (key.startsWith('B_')) {
			result[key.slice(2)] = value === 'true';
		} else {
			result[key] = value;
		}
	}
	return result;
}

function toDb(target: Record<string, any>) {
	const result: Record<string, any> = {};
	for (const [key, value] of Object.entries(target)) {
		switch (typeof value) {
			case 'boolean':
				result[`B_${key}`] = value;
				break;
			case 'number':
				result[`N_${key}`] = `${value}`;
				break;
			case 'object':
				if (Array.isArray(value)) {
					result[`O_${key}`] = JSON.stringify(value);
					break;
				}
				if (isObject(value)) {
					result[`O_${key}`] = JSON.stringify(value);
					break;
				}
				if (!Number.isNaN(value)) {
					result[`O_${key}`] = 'null';
					break;
				}
				result[`O_${key}`] = JSON.stringify(value);
				break;
			default:
				result[key] = value;
				break;
		}
	}
	return result;
}
