import type { DiscordEmoji } from '@biscuitland/api-types';
import { GuildBasedResource } from './default/guild-based';

export class Emojis extends GuildBasedResource<DiscordEmoji> {
	namespace = 'emoji';
}
