import type { APISticker } from '../../common';
import { Sticker } from '../../structures';
import { GuildRelatedResource } from './default/guild-related';

export class Stickers extends GuildRelatedResource {
	namespace = 'sticker';

	override async get(id: string): Promise<Sticker | undefined> {
		const rawSticker = (await super.get(id)) as APISticker;
		return rawSticker ? new Sticker(this.client, rawSticker) : undefined;
	}

	override async values(guild: string) {
		const emojis = (await super.values(guild)) as APISticker[];
		return emojis.map(rawSticker => new Sticker(this.client, rawSticker));
	}
}
