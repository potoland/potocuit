import type { BaseClient } from '../../../client/base';
import type { GatewayIntentBits } from '../../../common';
import type { Cache } from '../../index';

export class GuildRelatedResource<T = any> {
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

	parse(data: any, _id: string, guild_id: string) {
		data.guild_id = guild_id;
		return data;
	}

	get adapter() {
		return this.cache.adapter;
	}

	async removeIfNI(intent: keyof typeof GatewayIntentBits, id: string | string[], guildId: string) {
		if (!this.cache.hasIntent(intent)) {
			await this.remove(id, guildId);
		}
	}

	async setIfNI(intent: keyof typeof GatewayIntentBits, id: string, guildId: string, data: any) {
		if (!this.cache.hasIntent(intent)) {
			await this.set(id, guildId, data);
			return data;
		}
	}

	async get(id: string): Promise<(T & { guild_id: string }) | undefined> {
		return this.adapter.get(this.hashId(id));
	}

	async bulk(ids: string[]): Promise<(T & { guild_id: string })[]> {
		return (await this.adapter.get(ids.map(x => this.hashId(x)))).filter(x => x);
	}

	async set(__keys: string, guild: string, data: any): Promise<void>;
	async set(__keys: [string, any][], guild: string): Promise<void>;
	async set(__keys: string | [string, any][], guild: string, data?: any) {
		const keys: [string, any][] = Array.isArray(__keys) ? __keys : [[__keys, data]];

		await this.addToRelationship(
			keys.map(x => x[0]),
			guild,
		);
		await this.adapter.set(
			keys.map(([key, value]) => {
				return [this.hashId(key), this.parse(value, key, guild)];
			}),
		);
	}

	async patch(__keys: string, guild?: string, data?: any): Promise<void>;
	async patch(__keys: [string, any][], guild?: string): Promise<void>;
	async patch(__keys: string | [string, any][], guild?: string, data?: any) {
		const keys: [string, any][] = Array.isArray(__keys) ? __keys : [[__keys, data]];

		if (guild) {
			await this.addToRelationship(
				keys.map(x => x[0]),
				guild,
			);
			await this.adapter.patch(
				false,
				keys.map(([key, value]) => {
					return [this.hashId(key), this.parse(value, key, guild)];
				}),
			);
		} else {
			await this.adapter.patch(
				true,
				keys.map(([key, value]) => {
					return [this.hashId(key), value];
				}),
			);
		}
	}

	async remove(id: string | string[], guild: string) {
		const ids = Array.isArray(id) ? id : [id];
		await this.removeToRelationship(ids, guild);
		await this.adapter.remove(ids.map(x => this.hashId(x)));
	}

	async keys(guild: string): Promise<string[]> {
		return guild === '*'
			? await this.adapter.scan(this.hashId(guild), true)
			: (async () => {
					return (await this.adapter.getToRelationship(this.hashId(guild))).map(x => `${this.namespace}.${x}`);
			  })();
	}

	async values(guild: string): Promise<(T & { guild_id: string })[]> {
		return guild === '*'
			? await this.adapter.scan(this.hashId(guild))
			: (async () => {
					const keys = (await this.adapter.getToRelationship(this.hashId(guild))).map(x => `${this.namespace}.${x}`);
					return this.adapter.get(keys);
			  })();
	}

	async count(to: string) {
		return this.adapter.count(this.hashId(to));
	}

	async contains(id: string, guild: string) {
		return this.adapter.contains(this.hashId(guild), id);
	}

	async getToRelationship(guild: string) {
		return this.adapter.getToRelationship(this.hashId(guild));
	}

	async addToRelationship(id: string | string[], guild: string) {
		await this.adapter.addToRelationship(this.hashId(guild), id);
	}

	async removeToRelationship(id: string | string[], guild: string) {
		await this.adapter.removeToRelationship(this.hashId(guild), id);
	}

	async removeRelationship(id: string | string[]) {
		await this.adapter.removeRelationship((Array.isArray(id) ? id : [id]).map(x => this.hashId(x)));
	}

	hashId(id: string) {
		return `${this.namespace}.${id}`;
	}
}
