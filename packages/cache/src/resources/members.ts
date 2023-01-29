import type { DiscordMember } from '@biscuitland/api-types';
import { GuildBasedResource } from './default/guild-based';
import type { Role } from './roles';
import type { Cache } from '../index';

export class Members extends GuildBasedResource<PotoMember> {
	namespace = 'member';

	override parse(data: any, key: string, guild_id: string): PotoMember {
		data.guild_id = guild_id;
		data.user_id = data.user?.id ?? key;
		delete data.user;
		return data;
	}

	override async set(__keys: string, guild: string, data: any): Promise<void>;
	override async set(__keys: [string, any][], guild: string): Promise<void>;
	override async set(__keys: string | [string, any][], guild: string, data?: any) {

		const keys: [string, any][] = Array.isArray(__keys) ? __keys : [[__keys, data]];

		// Add to user cache
		await this.cache.bulkSet(keys.map(x => ['users', x[1].user, x[0]]));
		// await this.cache.users.addToRelationship(keys.map(x => x[0]));
		// await this.adapter.set(keys.map(([key, value]) => {
		// 	return [this.cache.users.hashId(key), value.user];
		// }));

		// Add to member cache
		// await this.addToRelationship(keys.map(x => x[0]), guild);
		await super.set(keys.map(([key, value]) => [key, value]), guild);

		// keys.forEach(([key, value]) => {
		// 	value.user_id = value.user?.id ?? key;
		// 	delete value.user;
		// });

		// await this.adapter.set(keys.map(([key, value]) => {
		// 	value.user_id = value.user.id;
		// 	delete value.user;
		// 	return [this.hashGuildId(key, guild), value]
		// }));
	}

	override async get(id: string, guild: string) {
		const rawMember = await super.get(id, guild);
		if (!rawMember) { return; }
		return new Member(rawMember, this.cache);
	}

	override async items(guild: string, options?: any) {
		const members = await super.items(guild, options);
		return members.map(rawMember => new Member(rawMember, this.cache));
	}

	// async getRolesMember(id: string, guild: string) {
	// 	return await this.cache.roles.getRolesMember(id, guild);
	// }
}

class Member implements PotoMember {
	constructor(data: PotoMember, cache: Cache) {
		// DiscordMember properties
		this.deaf = data.deaf;
		this.mute = data.mute;
		this.pending = data.pending;
		this.nick = data.nick;
		this.avatar = data.avatar;
		this.roles = data.roles;
		this.joined_at = data.joined_at;
		this.premium_since = data.premium_since;
		this.permissions = data.permissions;
		this.communication_disabled_until = data.communication_disabled_until;

		// PotoMember extra properties
		this.guild_id = data.guild_id;
		this.user_id = data.user_id;

		Object.defineProperty(this, 'cache', { value: cache });
	}

	// DiscordMember properties
	deaf?: boolean | undefined;
	mute?: boolean | undefined;
	pending?: boolean | undefined;
	nick?: string | null | undefined;
	avatar?: string | undefined;
	roles: string[];
	joined_at: string;
	premium_since?: string | null | undefined;
	permissions?: string | undefined;
	communication_disabled_until?: string | null | undefined;

	// PotoMember extra properties
	guild_id: string;
	user_id: string;

	private cache!: Cache;

	async getUser() {
		return this.cache.users.get(this.user_id);
	}

	async getRoles() {
		const roles: Role[] = [];

		for (const i of this.roles) {
			// if (!await this.cache.roles.contains(i, this.guild_id)) {
			// 	continue;
			// }
			roles.push((await this.cache.roles.get(i, this.guild_id))!);
		}

		const permissions = roles.reduce((acc, val) => acc | BigInt(val.permissions), 0n).toString();

		// 'permissions' only present in INTERACTION_CREATE
		if (this.roles.length !== roles.length || this.permissions === undefined || this.permissions !== permissions) {
			this.permissions = permissions;
			this.roles = roles.map(x => x.id);
			await this.cache.members.set(this.user_id, this.guild_id, { ...this });
		}
		return roles;
	}
}

interface PotoMember extends DiscordMember {
	guild_id: string;
	user_id: string;
}

// type Member = Omit<DiscordMember, 'user'> & {
// 	user_id: string;
// }
