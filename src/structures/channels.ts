import { mix } from 'ts-mixer';
import { BaseChannel, BaseGuildChannel, TextBaseChannel } from './methods/channel/base';
import type { APIDMChannel, APIGuildCategoryChannel, APIGuildForumChannel, APIGuildMediaChannel, APIGuildStageVoiceChannel, APIGuildVoiceChannel, APINewsChannel, APITextChannel, APIThreadChannel, ChannelType, ObjectToLower, ThreadAutoArchiveDuration } from '@biscuitland/common';
import { ChannelFlags, VideoQualityMode } from '@biscuitland/common';
import { DiscordBase } from './extra/DiscordBase';
import type { StringToNumber, ToClass } from '../types/util';
import { ThreadOnlyMethods } from './methods/channel/threadonly';
import { TopicableGuildChannel } from './methods/channel/topicable';

// los dm no tienen, lios threads deja veo, no tienen xdxd
// xd, maldito discord, TopicableGuildChannel xdd era joda
// bueno, justifica hacer una clase solo para eso XDDDDD
// que mrd con el status, ni en la api aparece :skull:
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
		return this.edit({ rate_limit_per_user });
	}

	setNsfw(nsfw = true, reason?: string) {
		return this.edit({ nsfw }, reason);
	}
}

export interface DMChannel extends ObjectToLower<APIDMChannel>, BaseChannel<ChannelType.DM> { }
@mix(TextBaseChannel)
export class DMChannel extends DiscordBase { }

export interface VoiceChannel extends ObjectToLower<APIGuildVoiceChannel>, Omit<TextGuildChannel, 'type'> { }
@mix(TextGuildChannel)
export class VoiceChannel extends DiscordBase {
	declare type: ChannelType.GuildVoice;
	setBitrate(bitrate: number | null, reason?: string) {
		return this.edit({ bitrate }, reason);
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

export interface StageChannel extends ObjectToLower<APIGuildStageVoiceChannel>, Omit<VoiceChannel, 'type'> { }
@mix(TopicableGuildChannel, VoiceChannel)
export class StageChannel extends DiscordBase {
	declare setTopic: (topic: string | null, reason?: string) => Promise<this>;
}

export interface MediaChannel extends ObjectToLower<APIGuildMediaChannel>, Omit<ThreadOnlyMethods, 'type'> { }
@mix(ThreadOnlyMethods)
export class MediaChannel extends DiscordBase {
	declare type: ChannelType.GuildMedia;
}

export interface ForumChannel extends ObjectToLower<APIGuildForumChannel>, Omit<ThreadOnlyMethods, 'type'> { }
@mix(ThreadOnlyMethods)
export class ForumChannel extends DiscordBase {
	declare type: ChannelType.GuildForum;
}

// ParentableChannel B)
// djskadajkdjs
// el unico canal que no tiene parent es el category, podemos hacerlo aparte y ya
// oc
export interface ThreadChannel extends ObjectToLower<APIThreadChannel>, Omit<TextGuildChannel, 'type'> { }
// el setParent va en el BaseGuildChannel?
// category extiende el base guild
// q, Xd
@mix(TextBaseChannel)
export class ThreadChannel extends DiscordBase {
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

	// hazlo como el videoquality
	// no tienen el mismo tipo de string ta feo el "OneDay"
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

export interface CategoryChannel extends ObjectToLower<APIGuildCategoryChannel> { }
// Temporal solution. dont ask.
export class CategoryChannel extends (BaseGuildChannel as unknown as ToClass<Omit<BaseGuildChannel, 'setParent' | 'type'>, CategoryChannel>) {
	declare type: ChannelType.GuildCategory;
}

// ah no si lo tiene xdxd,, n ose pq lo ponen dos veces
export interface NewsChannel extends ObjectToLower<APINewsChannel> { }
export class NewsChannel extends BaseChannel<ChannelType.GuildAnnouncement> {
	addFollower(webhook_channel_id: string, reason?: string) {
		return this.api.channels(this.id).followers.post({
			body: {
				webhook_channel_id
			}, reason
		});
	}
}
// lito
// xddxd
// https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/structures/DirectoryChannel.js#L9
// tengo como 12 pestañas buscando info de este canal dasdjkask
// no, no hay nada de eso en la api
// export interface DirectoryChannel extends ObjectToLower<guilddirectory> { }
// xdddddd
// estas claro de que BaseChannel no tiene un generic por lo tanto todos los canales tienen el mismo type excepto los que hubo que fixear? dsjasakdj
export class DirectoryChannel extends BaseChannel<ChannelType.GuildDirectory> {// xdddddddddddddddddddddddddddd gg
}

export type PotocuitChannels = BaseChannel<ChannelType> |
	BaseGuildChannel |
	TextGuildChannel |
	DMChannel |
	VoiceChannel |
	MediaChannel |
	ForumChannel |
	ThreadChannel |
	CategoryChannel |
	NewsChannel |
	DirectoryChannel;

// djs solo le agrega el addFollower, literal es el unico metodo que esta añadido/removido xd

// q yo sepa solo le agrega el metodo ese de publicar mensaje
// ninguno, no? po si
// si falta alguno la verdad pero no se, private y public thread es la misma mamada
// el news creo que funciona un poco diferente al textchannel y el directory channel aun no lo veo a profundidad, solo se que existe
// /nos van a funar
// asi es mas divertido
// xddd

// let x = {} as CategoryChannel;
// x.setParent; //<- error
