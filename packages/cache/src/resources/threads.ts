import type { DiscordChannel } from '@biscuitland/api-types';
import { GuildBasedResource } from './default/guild-based';

export class Threads extends GuildBasedResource<DiscordChannel> {
	namespace = 'thread';
}
