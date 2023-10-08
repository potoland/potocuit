import { mix } from 'ts-mixer';
import { BaseChannel } from './methods/channel/base';
import { MessagesMethods } from './methods/channel/messages';
import { APIDMChannel, APIGuildForumChannel, APIGuildMediaChannel, APIGuildStageVoiceChannel, APIGuildVoiceChannel, APITextChannel, APIThreadChannel, ChannelFlags, ObjectToLower, VideoQualityMode } from '@biscuitland/common';
import { DiscordBase } from './extra/DiscordBase';
import { ThreadOnlyMethods } from './methods/channel/threadonly';

export interface TextBaseChannel extends ObjectToLower<APITextChannel>, BaseChannel, MessagesMethods { }
@mix(MessagesMethods)
export class TextBaseChannel extends DiscordBase { }

export interface TextGuildChannel extends ObjectToLower<APITextChannel>, BaseChannel, TextBaseChannel { }
@mix(TextBaseChannel)
export class TextGuildChannel extends DiscordBase { }

export interface DMChannel extends ObjectToLower<APIDMChannel>, BaseChannel, MessagesMethods { }
@mix(TextBaseChannel)
export class DMChannel extends DiscordBase { }

export interface VoiceChannel extends ObjectToLower<APIGuildVoiceChannel>, BaseChannel, MessagesMethods { }
@mix(TextBaseChannel)
export class VoiceChannel extends DiscordBase {
	setBitrate(bitrate: number | null, reason?: string) {
		return this.edit({ bitrate }, reason)
	}

	setUserLimit(max: number | null, reason?: string) {
		return this.edit({ user_limit: max ?? 0 }, reason);
	}

	setRTC(region: string | null, reason?: string) {
		return this.edit({ rtc_region: region }, reason);
	}

	setVideoQuality(quality: keyof typeof VideoQualityMode, reason?: string) {
		return this.edit({ video_quality_mode: VideoQualityMode[quality] }, reason);
	}
}

export interface StageChannel extends ObjectToLower<APIGuildStageVoiceChannel>, Omit<VoiceChannel, "type"> { }
@mix(VoiceChannel)
export class StageChannel extends DiscordBase {
	setTopic(topic: string | null, reason?: string) {
		return this.edit({ topic }, reason);
	}
}

export interface MediaChannel extends ObjectToLower<APIGuildMediaChannel>, ThreadOnlyMethods { }
@mix(ThreadOnlyMethods)
export class MediaChannel extends DiscordBase { }

export interface ForumChannel extends ObjectToLower<APIGuildForumChannel>, ThreadOnlyMethods { }
@mix(ThreadOnlyMethods)
export class ForumChannel extends DiscordBase { }


export interface ThreadChannel extends ObjectToLower<APIThreadChannel>, BaseChannel, MessagesMethods { }
@mix(TextBaseChannel)
export class ThreadChannel extends DiscordBase {
	pin(reason?: string) {
		return this.edit({ flags: (this.flags ?? 0) | ChannelFlags.Pinned }, reason);
	}

	unpin(reason?: string) {
		return this.edit({ flags: (this.flags ?? 0) & ~ChannelFlags.Pinned }, reason)
	}

	setTags(tags: string[], reason?: string) {
		/*
		The available_tags field can be set when creating or updating a channel,
			which determines which tags can be set on individual threads within the thread's applied_tags field.
		*/
		//@ts-expect-error
		return this.edit({ applied_tags: tags }, reason);
	}

	setArchived(archived = true, reason?: string) {
		return this.edit({ archived }, reason);
	}
}

export type PotocuitChannels = BaseChannel |
	TextGuildChannel |
	DMChannel |
	VoiceChannel |
	MediaChannel |
	ForumChannel |
	ThreadChannel;
