import type { APIGuildVoiceChannel, ChannelType } from '@biscuitland/common';
import type { ObjectToLower } from '.';
import { TextBaseChannel } from './extra/TextBaseChannel';

export interface VoiceChannel
	extends TextBaseChannel, ObjectToLower<APIGuildVoiceChannel> { }

export class VoiceChannel extends TextBaseChannel {
	override name!: string;
	override type!: ChannelType.GuildVoice;
}
