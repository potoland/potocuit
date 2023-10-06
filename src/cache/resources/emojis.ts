import { GuildRelatedResource } from './default/guild-related';
// import { GuildEmoji } from '../../GuildEmoji';

export class Emojis extends GuildRelatedResource {
	namespace = 'emoji';

	// override async get(id: string, guild: string) {
	// 	const rawEmoji = await super.get(id, guild) as (APIEmoji & { id: string });
	// 	return rawEmoji ? new GuildEmoji(this.rest, this.cache, rawEmoji, guild) : undefined;
	// }

	// override async items(guild: string, options?: any) {
	// 	const emojis = await super.items(guild, options) as (APIEmoji & { id: string })[];
	// 	return emojis.map(rawEmoji => new GuildEmoji(this.rest, this.cache, rawEmoji, guild));
	// }
}
