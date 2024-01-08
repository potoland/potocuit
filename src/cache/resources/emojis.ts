import type { APIEmoji } from '../../common';
import { GuildEmoji } from '../../structures';
import { GuildRelatedResource } from './default/guild-related';

export class Emojis extends GuildRelatedResource {
	namespace = 'emoji';

	override async get(id: string) {
		const rawEmoji = await super.get(id);
		return rawEmoji ? new GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id) : undefined;
	}

	override async values(guild: string) {
		const emojis = (await super.values(guild)) as (APIEmoji & { id: string; guild_id: string })[];
		return emojis.map(rawEmoji => new GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id));
	}
}
