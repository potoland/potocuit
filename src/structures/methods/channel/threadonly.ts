import { APIGuildForumTag, ThreadAutoArchiveDuration, APIGuildForumDefaultReactionEmoji, SortOrderType } from "@biscuitland/common";
import { BaseChannel } from "./base";
import { DiscordBase } from "../../extra/DiscordBase";
import { mix } from "ts-mixer";

export interface ThreadOnlyMethods extends BaseChannel { }
@mix(BaseChannel)
export class ThreadOnlyMethods extends DiscordBase {
	setTags(tags: APIGuildForumTag[], reason?: string) {
		return this.edit({ available_tags: tags }, reason);
	}

	setAutoArchiveDuration(duration: ThreadAutoArchiveDuration, reason?: string) {
		return this.edit({ default_auto_archive_duration: duration }, reason);
	}

	setReactionEmoji(emoji: APIGuildForumDefaultReactionEmoji, reason?: string) {
		return this.edit({ default_reaction_emoji: emoji }, reason)
	}

	setSortOrder(sort: SortOrderType, reason?: string) {
		return this.edit({ default_sort_order: sort }, reason);
	}

	setThreadRateLimit(rate: number, reason?: string) {
		return this.edit({ default_thread_rate_limit_per_user: rate }, reason);
	}

	setTopic(topic: string | null, reason?: string) {
		return this.edit({ topic }, reason);
	}
}
