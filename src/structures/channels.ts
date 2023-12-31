import { mix } from 'ts-mixer';
import type {
	APIDMChannel,
	APIGuildCategoryChannel,
	APIGuildForumChannel,
	APIGuildMediaChannel,
	APIGuildStageVoiceChannel,
	APIGuildVoiceChannel,
	APINewsChannel,
	APITextChannel,
	APIThreadChannel,
	ChannelType,
	ObjectToLower,
	ThreadAutoArchiveDuration,
} from '../common';
import { ChannelFlags } from '../common';
import type { StringToNumber, ToClass } from '../common/types/util';
import { DiscordBase } from './extra/DiscordBase';
import { BaseChannel, BaseGuildChannel, TextBaseChannel } from './methods/channel/base';
import { MessagesMethods } from './methods/channel/messages';
import { ThreadOnlyMethods } from './methods/channel/threadonly';
import { TopicableGuildChannel } from './methods/channel/topicable';
import { VoiceChannelMethods } from './methods/channel/voice';
import { WebhookChannelMethods } from './methods/channel/webhooks';

export interface TextGuildChannel
	extends ObjectToLower<APITextChannel>,
		BaseGuildChannel,
		TextBaseChannel,
		WebhookChannelMethods {}
@mix(TextBaseChannel, WebhookChannelMethods)
export class TextGuildChannel extends BaseGuildChannel {
	setRatelimitPerUser(rate_limit_per_user: number | null | undefined) {
		return this.edit({ rate_limit_per_user });
	}

	setNsfw(nsfw = true, reason?: string) {
		return this.edit({ nsfw }, reason);
	}
}

export interface DMChannel extends ObjectToLower<APIDMChannel>, BaseChannel<ChannelType.DM> {}
@mix(TextBaseChannel, MessagesMethods)
export class DMChannel extends DiscordBase {}

export interface VoiceChannel
	extends ObjectToLower<APIGuildVoiceChannel>,
		Omit<TextGuildChannel, 'type' | 'fetch' | 'edit'>,
		VoiceChannelMethods,
		WebhookChannelMethods {}
@mix(TextGuildChannel, WebhookChannelMethods, VoiceChannelMethods)
export class VoiceChannel extends DiscordBase {
	declare type: ChannelType.GuildVoice;
}

export interface StageChannel extends ObjectToLower<APIGuildStageVoiceChannel>, Omit<VoiceChannel, 'type'> {}
@mix(TopicableGuildChannel, VoiceChannelMethods)
export class StageChannel extends DiscordBase {
	declare setTopic: (topic: string | null, reason?: string) => Promise<this>;
}

export interface MediaChannel extends ObjectToLower<APIGuildMediaChannel>, Omit<ThreadOnlyMethods, 'type'> {}
@mix(ThreadOnlyMethods)
export class MediaChannel extends DiscordBase {
	declare type: ChannelType.GuildMedia;
}

export interface ForumChannel
	extends ObjectToLower<APIGuildForumChannel>,
		Omit<ThreadOnlyMethods, 'type'>,
		WebhookChannelMethods {}
@mix(ThreadOnlyMethods, WebhookChannelMethods)
export class ForumChannel extends DiscordBase {
	declare type: ChannelType.GuildForum;
}

export interface ThreadChannel extends ObjectToLower<APIThreadChannel>, Omit<TextGuildChannel, 'type'> {}
@mix(TextBaseChannel)
export class ThreadChannel extends DiscordBase {
	webhooks = WebhookChannelMethods.channel({
		api: this.api,
		client: this.client,
		id: this.parentId!,
	});

	pin(reason?: string) {
		return this.edit({ flags: (this.flags ?? 0) | ChannelFlags.Pinned }, reason);
	}

	unpin(reason?: string) {
		return this.edit({ flags: (this.flags ?? 0) & ~ChannelFlags.Pinned }, reason);
	}

	setTags(applied_tags: string[], reason?: string) {
		/**
		 * The available_tags field can be set when creating or updating a channel.
		 * Which determines which tags can be set on individual threads within the thread's applied_tags field.
		 */
		return this.edit({ applied_tags }, reason);
	}

	setArchived(archived = true, reason?: string) {
		return this.edit({ archived }, reason);
	}

	setAutoArchiveDuration(auto_archive_duration: StringToNumber<`${ThreadAutoArchiveDuration}`>, reason?: string) {
		return this.edit({ auto_archive_duration }, reason);
	}

	setInvitable(invitable = true, reason?: string) {
		return this.edit({ invitable }, reason);
	}

	setLocked(locked = true, reason?: string) {
		return this.edit({ locked }, reason);
	}
}

export interface CategoryChannel extends ObjectToLower<APIGuildCategoryChannel> {}

export class CategoryChannel extends (BaseGuildChannel as unknown as ToClass<
	Omit<BaseGuildChannel, 'setParent' | 'type'>,
	CategoryChannel
>) {
	declare type: ChannelType.GuildCategory;
}

export interface NewsChannel extends ObjectToLower<APINewsChannel>, WebhookChannelMethods {}
@mix(WebhookChannelMethods)
export class NewsChannel extends BaseChannel<ChannelType.GuildAnnouncement> {
	addFollower(webhook_channel_id: string, reason?: string) {
		return this.api.channels(this.id).followers.post({
			body: {
				webhook_channel_id,
			},
			reason,
		});
	}
}

export class DirectoryChannel extends BaseChannel<ChannelType.GuildDirectory> {}

export type PotocuitChannels =
	| BaseChannel<ChannelType>
	| BaseGuildChannel
	| TextGuildChannel
	| DMChannel
	| VoiceChannel
	| MediaChannel
	| ForumChannel
	| ThreadChannel
	| CategoryChannel
	| NewsChannel
	| DirectoryChannel
	| StageChannel;
