import type { APISticker } from '@biscuitland/common';
import { GuildBasedResource } from './default/guild-based';

export class Stickers extends GuildBasedResource<APISticker> {
	namespace = 'sticker';
}
