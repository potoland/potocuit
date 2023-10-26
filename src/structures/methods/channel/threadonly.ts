import type { APIGuildForumTag, ThreadAutoArchiveDuration, APIGuildForumDefaultReactionEmoji, SortOrderType, ChannelType } from '@biscuitland/common';
import { mix } from 'ts-mixer';
import { DiscordBase } from '../../extra/DiscordBase';
import { TopicableGuildChannel } from './topicable';
import type { BaseChannel } from './base';

export interface ThreadOnlyMethods extends BaseChannel<ChannelType.PublicThread | ChannelType.PrivateThread> { }
@mix(TopicableGuildChannel)
export class ThreadOnlyMethods extends DiscordBase {
	setTags(tags: APIGuildForumTag[], reason?: string) {
		return this.edit({ available_tags: tags }, reason);
	}

	setAutoArchiveDuration(duration: ThreadAutoArchiveDuration, reason?: string) {
		return this.edit({ default_auto_archive_duration: duration }, reason);
	}

	setReactionEmoji(emoji: APIGuildForumDefaultReactionEmoji, reason?: string) {
		return this.edit({ default_reaction_emoji: emoji }, reason);
	}

	setSortOrder(sort: SortOrderType, reason?: string) {
		return this.edit({ default_sort_order: sort }, reason);
	}

	setThreadRateLimit(rate: number, reason?: string) {
		return this.edit({ default_thread_rate_limit_per_user: rate }, reason);
	}
}