import type { DiscordChannel } from '@biscuitland/api-types';
import { GuildBasedResource } from './default/guild-based';

export class Channels extends GuildBasedResource<DiscordChannel> {
	namespace = 'channel';
}
