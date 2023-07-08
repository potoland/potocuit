import type {
	APIGuildTextChannel,
	GuildTextChannelType,
	ObjectToLower
} from '@biscuitland/common';
import { Mixin } from 'ts-mixer';
import { BaseGuildChannel } from './BaseGuildChannel';
import { TextBaseChannel } from './TextBaseChannel';

export interface TextBaseGuildChannel
	extends TextBaseChannel,
	BaseGuildChannel,
	ObjectToLower<APIGuildTextChannel<GuildTextChannelType>> { }

export class TextBaseGuildChannel extends Mixin(BaseGuildChannel, TextBaseChannel) {
	declare name: string;
	declare type: GuildTextChannelType;
	declare guildId: string;
}
