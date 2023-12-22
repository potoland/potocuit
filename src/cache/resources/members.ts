import { GuildBasedResource } from "./default/guild-based";
// import { GuildMember } from '../../GuildMember';

export class Members extends GuildBasedResource {
  namespace = "member";

  override parse(data: any, key: string, guild_id: string) {
    data.guild_id = guild_id;
    data.id = data.user?.id ?? key;
    delete data.user;
    return data;
  }

  override async set(memberId: string, guildId: string, data: any): Promise<void>;
  override async set(memberId_dataArray: [string, any][], guildId: string): Promise<void>;
  override async set(__keys: string | [string, any][], guild: string, data?: any) {
    const keys: [string, any][] = Array.isArray(__keys) ? __keys : [[__keys, data]];
    const bulkData: (["members", any, string, string] | ["users", any, string])[] = [];

    for (const [id, value] of keys) {
      if (value.user) {
        bulkData.push(["members", value, id, guild]);
        bulkData.push(["users", value.user, id]);
      }
    }

    await this.cache.bulkSet(bulkData);
  }

  // override async get(id: string, guild: string) {
  // 	const rawMember = await super.get(id, guild) as APIGuildMember | undefined;
  // 	return rawMember ? new GuildMember(this.rest, this.cache, rawMember, rawMember.user!, guild) : undefined;
  // }

  // override async items(guild: string, options?: any) {
  // 	const members = await super.items(guild, options) as APIGuildMember[];
  // 	return members.map(rawMember => new GuildMember(this.rest, this.cache, rawMember, rawMember.user!, guild));
  // }

  // async getRolesMember(id: string, guild: string) {
  // 	return await this.cache.roles.getRolesMember(id, guild);
  // }
}
