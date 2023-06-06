import type { APIChannel } from '@biscuitland/common';
import { GuildBasedResource } from './default/guild-based';

export class Channels extends GuildBasedResource<APIChannel> {
	namespace = 'channel';
}
