import type { DiscordSticker } from '@biscuitland/api-types';
import { GuildBasedResource } from './default/guild-based';

export class Stickers extends GuildBasedResource<DiscordSticker> {
	namespace = 'sticker';
}
