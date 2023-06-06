import type { Cache } from '../../index';

export class GuildBasedResource<T = any> {
	namespace = 'base';
	protected cache: Cache;

	constructor(cache: Cache) {
		this.cache = cache;
	}

	parse(data: any, _id: string, guild_id: string) {
		data.guild_id = guild_id;
		return data;
	}

	get adapter() {
		return this.cache.adapter;
	}

	async get(id: string, guild: string): Promise<(T & { guild_id: string }) | undefined> {
		return await this.adapter.get(this.hashGuildId(id, guild));
	}

	async set(__keys: string, guild: string, data: any): Promise<void>;
	async set(__keys: [string, any][], guild: string): Promise<void>;
	async set(__keys: string | [string, any][], guild: string, data?: any) {
		const keys: [string, any][] = Array.isArray(__keys) ? __keys : [[__keys, data]];

		await this.addToRelationship(keys.map(x => x[0]), guild);
		await this.adapter.set(keys.map(([key, value]) => {
			return [this.hashGuildId(key, guild), this.parse(value, key, guild)];
		}));
	}

	async remove(id: string | string[], guild: string) {
		const ids = Array.isArray(id) ? id : [id];
		await this.removeToRelationship(ids, guild);
		await this.adapter.remove(ids.map(x => this.hashGuildId(x, guild)));
	}

	async keys(guild: string, options?: any): Promise<string[]> {
		return await this.adapter.keys(this.hashId(guild), options);
	}

	async items(guild: string, options?: any): Promise<(T & { guild_id: string })[]> {
		return await this.adapter.items(this.hashId(guild), options);
	}

	async count(to: string) {
		return await this.adapter.count(this.hashId(to));
	}

	async contains(id: string, guild: string) {
		return await this.adapter.contains(this.hashId(guild), id);
	}

	async getToRelationship(guild: string) {
		return await this.adapter.getToRelationship(this.hashId(guild));
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

	hashGuildId(id: string, guild?: string): string {
		if (!guild) {
			return this.hashId(id);
		}

		return `${this.namespace}.${guild}.${id}`;
	}
}
