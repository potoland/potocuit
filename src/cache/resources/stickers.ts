import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { Sticker } from '../../structures';
import { GuildRelatedResource } from './default/guild-related';

export class Stickers extends GuildRelatedResource {
	namespace = 'sticker';

	override get(id: string): ReturnCache<Sticker | undefined> {
		return fakePromise(super.get(id)).then(rawSticker =>
			rawSticker ? new Sticker(this.client, rawSticker) : undefined,
		);
	}

	// override async values(guild: string) {
	// 	const emojis = (await super.values(guild)) as APISticker[];
	// 	return emojis.map(rawSticker => new Sticker(this.client, rawSticker));
	// }
}
