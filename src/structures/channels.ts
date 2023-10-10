import { mix } from 'ts-mixer';
import { BaseChannel } from './methods/channel/base';
import { MessagesMethods } from './methods/channel/messages';
import { APIDMChannel, APIGuildCategoryChannel, APIGuildForumChannel, APIGuildForumDefaultReactionEmoji, APIGuildForumTag, APIGuildMediaChannel, APIGuildStageVoiceChannel, APIGuildVoiceChannel, APITextChannel, APIThreadChannel, ChannelFlags, ObjectToLower, SortOrderType, ThreadAutoArchiveDuration, VideoQualityMode } from '@biscuitland/common';
import { DiscordBase } from './extra/DiscordBase';
import { ToClass } from '../types/util';

export class BaseGuildChannel extends BaseChannel {
	setPosition(position: number, reason?: string) {
		return this.edit({ position }, reason);
	}

	setName(name: string, reason?: string) {
		return this.edit({ name }, reason);
	}
	//y si,tipo, magia negra :pleading:
	// como debe de ser
	setParent(parent_id: string | null, reason?: string) {
		return this.edit({ parent_id }, reason)
	}
	// por eso te dije que necesitabamos un mixin que ignorara props ddjsdkjdkasdjkasdladjaskldjaskld
}

export interface TextBaseChannel extends ObjectToLower<APITextChannel>, MessagesMethods { }
@mix(MessagesMethods)
export class TextBaseChannel extends BaseGuildChannel { }


//los dm no tienen, lios threads deja veo, no tienen xdxd
//xd, maldito discord, TopicableGuildChannel xdd era joda
// bueno, justifica hacer una clase solo para eso XDDDDD
//que mrd con el status, ni en la api aparece :skull:
/*
{
  id: '813817146764427334',
  type: 2,
  last_message_id: null,
  flags: 0,
  guild_id: '684551832793776128',
  name: 'uwu',
  parent_id: '813817143267295304',
  rate_limit_per_user: 0,
  bitrate: 96000,
  user_limit: 0,
  rtc_region: null,
  position: 2,
  permission_overwrites: [Array],
  nsfw: false
}
mira dc
se supone que ese canal tiene de status "xdd" wtf
*/

export interface TextGuildChannel extends ObjectToLower<APITextChannel>, BaseGuildChannel, TextBaseChannel { }
@mix(TextBaseChannel)
export class TextGuildChannel extends BaseGuildChannel {
	setRatelimitPerUser(rate_limit_per_user: number | null | undefined) {
		return this.edit({ rate_limit_per_user })
	}

	setNsfw(nsfw = true, reason?: string) {
		return this.edit({ nsfw }, reason)
	}
}

export class TopicableGuildChannel extends BaseGuildChannel {
	setTopic(topic: string | null, reason?: string) {
		return this.edit({ topic }, reason);
	}
}

export interface ThreadOnlyMethods extends TopicableGuildChannel { }
@mix(TopicableGuildChannel)
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
}

export interface DMChannel extends ObjectToLower<APIDMChannel>, BaseChannel, MessagesMethods { }
@mix(TextBaseChannel)
export class DMChannel extends DiscordBase { }

export interface VoiceChannel extends ObjectToLower<APIGuildVoiceChannel>, Omit<TextGuildChannel, 'type'> { }
@mix(TextGuildChannel)
export class VoiceChannel extends DiscordBase {
	setBitrate(bitrate: number | null, reason?: string) {
		return this.edit({ bitrate }, reason)
	}

	setUserLimit(user_limit: number | null, reason?: string) {
		return this.edit({ user_limit: user_limit ?? 0 }, reason);
	}

	setRTC(rtc_region: string | null, reason?: string) {
		return this.edit({ rtc_region }, reason);
	}

	setVideoQuality(quality: keyof typeof VideoQualityMode, reason?: string) {
		return this.edit({ video_quality_mode: VideoQualityMode[quality] }, reason);
	}
}

export interface StageChannel extends ObjectToLower<APIGuildStageVoiceChannel>, Omit<VoiceChannel, "type"> { }
@mix(TopicableGuildChannel, VoiceChannel)
export class StageChannel extends DiscordBase {
	declare setTopic: (topic: string | null, reason?: string) => Promise<this>;
}

export interface MediaChannel extends ObjectToLower<APIGuildMediaChannel>, ThreadOnlyMethods { }
@mix(ThreadOnlyMethods)
export class MediaChannel extends DiscordBase { }

export interface ForumChannel extends ObjectToLower<APIGuildForumChannel>, ThreadOnlyMethods { }
@mix(ThreadOnlyMethods)
export class ForumChannel extends DiscordBase { }

//ParentableChannel B)
// djskadajkdjs
// el unico canal que no tiene parent es el category, podemos hacerlo aparte y ya
//oc
export interface ThreadChannel extends ObjectToLower<APIThreadChannel>, Omit<TextGuildChannel, "type"> { }
//el setParent va en el BaseGuildChannel?
// category extiende el base guild
//q, Xd
@mix(TextBaseChannel)
export class ThreadChannel extends DiscordBase {
	pin(reason?: string) {
		return this.edit({ flags: (this.flags ?? 0) | ChannelFlags.Pinned }, reason);
	}

	unpin(reason?: string) {
		return this.edit({ flags: (this.flags ?? 0) & ~ChannelFlags.Pinned }, reason)
	}

	setTags(applied_tags: string[], reason?: string) {
		/**
		 * The available_tags field can be set when creating or updating a channel.
		 * Which determines which tags can be set on individual threads within the thread's applied_tags field.
		 */
		// @ts-expect-error dapi moment
		return this.edit({ applied_tags }, reason);
	}

	setArchived(archived = true, reason?: string) {
		return this.edit({ archived }, reason);
	}

	//hazlo como el videoquality
	// no tienen el mismo tipo de string ta feo el "OneDay"
	setAutoArchiveDuration(auto_archive_duration: ThreadAutoArchiveDuration, reason?: string) {
		return this.edit({ auto_archive_duration }, reason);
	}

	setInvitable(invitable = true, reason?: string) {
		return this.edit({ invitable }, reason);
	}

	setLocked(locked = true, reason?: string) {
		return this.edit({ locked }, reason);
	}
}

export interface CategoryChannel extends ObjectToLower<APIGuildCategoryChannel> { }
//Temporal solution. dont ask.
export class CategoryChannel extends (BaseGuildChannel as unknown as ToClass<Omit<BaseGuildChannel, "setParent">, CategoryChannel>) { }

export type PotocuitChannels = BaseChannel |
	BaseGuildChannel |
	TextGuildChannel |
	DMChannel |
	VoiceChannel |
	MediaChannel |
	ForumChannel |
	ThreadChannel |
	CategoryChannel;

///nos van a funar
// asi es mas divertido
//xddd

// let x = {} as CategoryChannel;
// x.setParent; <- error
