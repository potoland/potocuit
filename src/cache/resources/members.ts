import type { APIGuildMember } from '../../common';
import { GuildMember } from '../../structures';
import { GuildBasedResource } from './default/guild-based';
export class Members extends GuildBasedResource {
	namespace = 'member';

	override parse(data: any, key: string, guild_id: string) {
		const modified = super.parse(data, data.user?.id ?? key, guild_id);
		const { user, ...rest } = modified;
		return rest;
	}

	override async get(id: string, guild: string): Promise<GuildMember | undefined> {
		const rawMember = (await super.get(id, guild)) as APIGuildMember;
		const user = await this.client.cache.users?.get(id);
		return rawMember && user ? new GuildMember(this.client, rawMember, user, guild) : undefined;
	}

	override async values(guild: string) {
		const members = await super.values(guild);
		const users = (await this.client.cache.users?.values()) ?? [];
		return members
			.map(rawMember => {
				const user = users.find(x => x.id === rawMember.id);
				return user ? new GuildMember(this.client, rawMember, user, guild) : undefined;
			})
			.filter(Boolean) as GuildMember[];
	}

	override async set(memberId: string, guildId: string, data: any): Promise<void>;
	override async set(memberId_dataArray: [string, any][], guildId: string): Promise<void>;
	override async set(__keys: string | [string, any][], guild: string, data?: any) {
		const keys: [string, any][] = Array.isArray(__keys) ? __keys : [[__keys, data]];
		const bulkData: (['members', any, string, string] | ['users', any, string])[] = [];

		for (const [id, value] of keys) {
			if (value.user) {
				bulkData.push(['members', value, id, guild]);
				bulkData.push(['users', value.user, id]);
			}
		}

		await this.cache.bulkSet(bulkData);
	}
}
