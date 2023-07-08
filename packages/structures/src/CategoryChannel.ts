import type { APIGuildCategoryChannel, ChannelType, ObjectToLower } from '@biscuitland/common';
import { BaseChannel } from './extra/BaseChannel';

export interface CategoryChannel
	extends BaseChannel, ObjectToLower<APIGuildCategoryChannel> { }

export class CategoryChannel extends BaseChannel {
	declare name: string;
	declare type: ChannelType.GuildCategory;
}
