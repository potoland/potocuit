import {
	ChannelFlags,
	type APIDMChannel,
	type APIGuildCategoryChannel,
	type APIGuildForumChannel,
	type APIGuildMediaChannel,
	type APIGuildStageVoiceChannel,
	type APIGuildVoiceChannel,
	type APINewsChannel,
	type APITextChannel,
	type APIThreadChannel,
	type ChannelType,
	type ThreadAutoArchiveDuration,
} from 'discord-api-types/v10';
import { mix } from 'ts-mixer';
import type { ObjectToLower, StringToNumber, ToClass } from '../common';
import {
	BaseChannel,
	BaseGuildChannel,
	MessagesMethods,
	TextBaseChannel,
	ThreadOnlyMethods,
	TopicableGuildChannel,
	VoiceChannelMethods,
	WebhookChannelMethods,
} from './methods/channels';

export interface TextGuildChannel
	extends ObjectToLower<Omit<APITextChannel, 'type'>>,
		BaseGuildChannel,
		TextBaseChannel,
		WebhookChannelMethods {}
@mix(TextBaseChannel, WebhookChannelMethods)
export class TextGuildChannel extends BaseGuildChannel {
	declare type: ChannelType.GuildText;

	setRatelimitPerUser(rate_limit_per_user: number | null | undefined) {
		return this.edit({ rate_limit_per_user });
	}

	setNsfw(nsfw = true, reason?: string) {
		return this.edit({ nsfw }, reason);
	}
}

export interface DMChannel extends ObjectToLower<APIDMChannel>, Omit<MessagesMethods, 'edit'> {}
@mix(MessagesMethods)
export class DMChannel extends (BaseChannel<ChannelType.DM> as unknown as ToClass<
	Omit<BaseChannel<ChannelType.DM>, 'edit'>,
	DMChannel
>) {
	declare type: ChannelType.DM;
}
export interface VoiceChannel
	extends ObjectToLower<APIGuildVoiceChannel>,
		Omit<TextGuildChannel, 'type'>,
		VoiceChannelMethods,
		WebhookChannelMethods {}
@mix(TextGuildChannel, WebhookChannelMethods, VoiceChannelMethods)
export class VoiceChannel extends BaseChannel<ChannelType.GuildVoice> {
	declare type: ChannelType.GuildVoice;
}

export interface StageChannel
	extends ObjectToLower<Omit<APIGuildStageVoiceChannel, 'type'>>,
		TopicableGuildChannel,
		VoiceChannelMethods {}
@mix(TopicableGuildChannel, VoiceChannelMethods)
export class StageChannel extends BaseChannel<ChannelType> {
	declare type: ChannelType.GuildStageVoice;
}

export interface MediaChannel extends ObjectToLower<Omit<APIGuildMediaChannel, 'type'>>, ThreadOnlyMethods {}
@mix(ThreadOnlyMethods)
export class MediaChannel extends BaseChannel<ChannelType> {
	declare type: ChannelType.GuildMedia;
}

export interface ForumChannel
	extends ObjectToLower<APIGuildForumChannel>,
		Omit<ThreadOnlyMethods, 'type'>,
		WebhookChannelMethods {}
@mix(ThreadOnlyMethods, WebhookChannelMethods)
export class ForumChannel extends BaseChannel<ChannelType.GuildForum> {
	declare type: ChannelType.GuildForum;
}

export interface ThreadChannel extends ObjectToLower<APIThreadChannel>, BaseGuildChannel {}
@mix(BaseGuildChannel)
export class ThreadChannel extends BaseChannel<
	ChannelType.PublicThread | ChannelType.AnnouncementThread | ChannelType.PrivateThread
> {
	declare type: ChannelType.PublicThread | ChannelType.AnnouncementThread | ChannelType.PrivateThread;
	webhooks = WebhookChannelMethods.channel({
		client: this.client,
		channelId: this.parentId!,
	});

	setRatelimitPerUser(rate_limit_per_user: number | null | undefined) {
		return this.edit({ rate_limit_per_user });
	}

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
	declare type: ChannelType.GuildAnnouncement;

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

export type AllGuildChannels =
	| TextGuildChannel
	| VoiceChannel
	| MediaChannel
	| ForumChannel
	| ThreadChannel
	| CategoryChannel
	| NewsChannel
	| DirectoryChannel
	| StageChannel;

export type AllTextableChannels = TextGuildChannel | VoiceChannel | DMChannel | NewsChannel | ThreadChannel;
export type AllGuildTextableChannels = TextGuildChannel | VoiceChannel | NewsChannel | ThreadChannel;

export type AllChannels =
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
