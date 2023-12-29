import type { ChannelType } from '@biscuitland/common';
import { DiscordBase } from '../../extra/DiscordBase';
import type { BaseChannel } from './base';

export interface TopicableGuildChannel extends BaseChannel<ChannelType> {}
export class TopicableGuildChannel extends DiscordBase {
	setTopic(topic: string | null, reason?: string) {
		return this.edit({ topic }, reason);
	}
}
