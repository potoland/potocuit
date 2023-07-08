import type { APIThreadChannel, ChannelType, ObjectToLower } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { TextBaseGuildChannel } from './extra/TextBaseGuildChannel';
import type { Cache } from './cache';

export interface ThreadChannel extends TextBaseGuildChannel, ObjectToLower<APIThreadChannel> { }

export class ThreadChannel extends TextBaseGuildChannel {
	declare name: string;
	declare type: ChannelType.PublicThread | ChannelType.PrivateThread | ChannelType.AnnouncementThread;
	declare guildId: string;
	constructor(rest: BiscuitREST, cache: Cache, data: APIThreadChannel) {
		super(rest, cache, data);
	}
}
