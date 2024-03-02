import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { GuildEmoji } from '../../structures';
import { GuildRelatedResource } from './default/guild-related';

export class Emojis extends GuildRelatedResource {
	namespace = 'emoji';

	override get(id: string): ReturnCache<GuildEmoji | undefined> {
		return fakePromise(super.get(id)).then(rawEmoji =>
			rawEmoji ? new GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id) : undefined,
		);
	}

	// override async values(guild: string) {
	// 	const emojis = (await super.values(guild)) as (APIEmoji & { id: string; guild_id: string })[];
	// 	return emojis.map(rawEmoji => new GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id));
	// }
}
