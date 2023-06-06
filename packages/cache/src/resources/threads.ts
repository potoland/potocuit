import type { APIThreadChannel } from '@biscuitland/common';
import { GuildBasedResource } from './default/guild-based';

export class Threads extends GuildBasedResource<APIThreadChannel> {
	namespace = 'thread';
}
