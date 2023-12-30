import { APIGuildMember } from '../../common';
import { GuildMember } from '../../structures';
import { GuildBasedResource } from './default/guild-based';
export class Members extends GuildBasedResource {
	namespace = 'member';

	override parse(data: any, key: string, guild_id: string) {
		data.guild_id = guild_id;
		data.id = data.user?.id ?? key;
		delete data.user;
		return data;
	}

	override async get(id: string, guild: string): Promise<GuildMember | undefined> {
		const rawMember = (await super.get(id, guild)) as APIGuildMember;
		return rawMember ? new GuildMember(this.client, rawMember, rawMember.user!, guild) : undefined;
	}

	override async values(guild: string) {
		const members = await super.values(guild);
		return members.map((rawMember) => new GuildMember(this.client, rawMember, rawMember.user, guild));
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
