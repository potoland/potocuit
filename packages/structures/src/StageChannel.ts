import type { APIGuildStageVoiceChannel, ChannelType, ObjectToLower } from '@biscuitland/common';
import { TextBaseGuildChannel } from './extra/TextBaseGuildChannel';

export interface StageChannel
	extends TextBaseGuildChannel,
	ObjectToLower<APIGuildStageVoiceChannel> { }

export class StageChannel extends TextBaseGuildChannel {
	declare guildId: string;
	declare type: ChannelType.GuildStageVoice;
}
