import type { APIGuildCategoryChannel, ChannelType } from '@biscuitland/common';
import type { ObjectToLower } from '.';
import { BaseChannel } from './extra/BaseChannel';

export interface CategoryChannel
	extends BaseChannel, ObjectToLower<APIGuildCategoryChannel> { }

export class CategoryChannel extends BaseChannel {
	declare name: string;
	declare type: ChannelType.GuildCategory;
}
