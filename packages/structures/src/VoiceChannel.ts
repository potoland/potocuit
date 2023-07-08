import type { APIGuildVoiceChannel, ChannelType, ObjectToLower } from '@biscuitland/common';
import { TextBaseChannel } from './extra/TextBaseChannel';

export interface VoiceChannel
	extends TextBaseChannel, ObjectToLower<APIGuildVoiceChannel> { }

export class VoiceChannel extends TextBaseChannel {
	declare name: string;
	declare type: ChannelType.GuildVoice;
}
