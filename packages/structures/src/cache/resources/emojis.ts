import type { APIEmoji } from '@biscuitland/common';
import { GuildBasedResource } from './default/guild-based';

export class Emojis extends GuildBasedResource<APIEmoji> {
	namespace = 'emoji';
}
