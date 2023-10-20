import type { ChannelType } from '@biscuitland/common';
import type { BaseChannel } from './base';
import { DiscordBase } from '../../extra/DiscordBase';

export interface TopicableGuildChannel extends BaseChannel<ChannelType> { }
export class TopicableGuildChannel extends DiscordBase {
	setTopic(topic: string | null, reason?: string) {
		return this.edit({ topic }, reason);
	}
}
