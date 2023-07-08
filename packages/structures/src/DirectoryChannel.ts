import type { ChannelType } from '@biscuitland/common';
import { BaseChannel } from './extra/BaseChannel';

export class DirectoryChannel extends BaseChannel {
	declare type: ChannelType.GuildDirectory;
}
