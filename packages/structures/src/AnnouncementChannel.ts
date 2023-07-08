import type { APINewsChannel, ChannelType, ObjectToLower, RESTPostAPIChannelFollowersJSONBody } from '@biscuitland/common';
import { TextBaseGuildChannel } from './extra/TextBaseGuildChannel';

export interface AnnouncementChannel extends TextBaseGuildChannel, ObjectToLower<APINewsChannel> { }


export class AnnouncementChannel extends TextBaseGuildChannel {
	declare name: string;
	declare type: ChannelType.GuildAnnouncement;
	declare guildId: string;

	follow(body: RESTPostAPIChannelFollowersJSONBody, reason?: string) {
		return this.api.channels(this.id).followers.post({ body, reason });
	}
}
