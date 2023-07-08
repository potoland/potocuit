import type { ChannelType } from '@biscuitland/common';
import { BaseGuildChannel } from './extra/BaseGuildChannel';

export class ForumChannel extends BaseGuildChannel {
	declare type: ChannelType.GuildForum;
	declare guildId: string;
}
