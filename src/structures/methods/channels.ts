import { mix } from 'ts-mixer';
import {
	CategoryChannel,
	DMChannel,
	DirectoryChannel,
	ForumChannel,
	MediaChannel,
	NewsChannel,
	StageChannel,
	TextGuildChannel,
	ThreadChannel,
	VoiceChannel,
	Webhook,
	channelLink,
	type APIGuildChannel,
	type AllChannels,
	type Guild,
	type RESTPatchAPIGuildChannelPositionsJSONBody,
	type RESTPostAPIGuildChannelJSONBody,
} from '../..';
import { MessageEmbed, resolveAttachment } from '../../builders';
import type { BaseClient } from '../../client/base';
import {
	ChannelType,
	VideoQualityMode,
	type APIChannelBase,
	type APIGuildForumDefaultReactionEmoji,
	type APIGuildForumTag,
	type APITextChannel,
	type EmojiResolvable,
	type MessageCreateBodyRequest,
	type MessageUpdateBodyRequest,
	type MethodContext,
	type ObjectToLower,
	type RESTGetAPIChannelMessageReactionUsersQuery,
	type RESTPatchAPIChannelJSONBody,
	type RESTPostAPIChannelWebhookJSONBody,
	type SortOrderType,
	type ThreadAutoArchiveDuration,
} from '../../common';
import { ComponentsListener } from '../../components/listener';
import { DiscordBase } from '../extra/DiscordBase';

export class BaseChannel<T extends ChannelType> extends DiscordBase<APIChannelBase<ChannelType>> {
	declare type: T;

	constructor(client: BaseClient, data: APIChannelBase<ChannelType>) {
		super(client, data);
	}
	// @ts-ignore
	private get __guildId__() {
		return 'guildId' in this ? (this.guildId as string) : '@me';
	}

	static __intent__(id: '@me'): 'DirectMessages';
	static __intent__(id: string): 'DirectMessages' | 'Guilds';
	static __intent__(id: string) {
		return id === '@me' ? 'DirectMessages' : 'Guilds';
	}

	/** The URL to the channel */
	get url() {
		return channelLink(this.id);
	}

	fetch(force = false) {
		return this.client.channels.fetch(this.id, force);
	}

	delete(reason?: string) {
		return this.client.channels.delete(this.id, { reason });
	}

	edit(body: RESTPatchAPIChannelJSONBody, reason?: string) {
		return this.client.channels.edit(this.id, body, { reason });
	}

	toString() {
		return `<#${this.id}>`;
	}

	static allMethods(ctx: MethodContext<{ guildId: string }>) {
		const methods = ctx.client.guilds.channels;
		return {
			list: (force = false) => methods.list(ctx.guildId, force),
			fetch: (id: string, force = false) => methods.fetch(ctx.guildId, id, force),
			create: (body: RESTPostAPIGuildChannelJSONBody) => methods.create(ctx.guildId, body),
			delete: (id: string, reason?: string) => methods.delete(ctx.guildId, id, reason),
			edit: (id: string, body: RESTPatchAPIChannelJSONBody, reason?: string) =>
				methods.edit(ctx.guildId, id, body, reason),
			editPositions: (body: RESTPatchAPIGuildChannelPositionsJSONBody) => methods.editPositions(ctx.guildId, body),
		};
	}
}

export interface BaseGuildChannel extends ObjectToLower<APIGuildChannel<ChannelType.GuildText>> {}
export class BaseGuildChannel extends BaseChannel<ChannelType.GuildText> {
	async guild(force?: true): Promise<Guild<'api'>>;
	async guild(force?: boolean): Promise<Guild<'cached'> | Guild<'api'>>;
	async guild(force = false) {
		return this.client.guilds.fetch(this.guildId!, force);
	}

	setPosition(position: number, reason?: string) {
		return this.edit({ position }, reason);
	}

	setName(name: string, reason?: string) {
		return this.edit({ name }, reason);
	}

	setParent(parent_id: string | null, reason?: string) {
		return this.edit({ parent_id }, reason);
	}
}

export interface MessagesMethods extends BaseChannel<ChannelType.GuildText> {}
export class MessagesMethods extends DiscordBase {
	typing() {
		return this.api.channels(this.id).typing.post();
	}

	messages = MessagesMethods.messages({ client: this.client, id: this.id });
	pins = MessagesMethods.pins({ client: this.client, id: this.id });
	reactions = MessagesMethods.reactions({ client: this.client, id: this.id });

	static messages(ctx: MethodContext<{ id: string }>) {
		const methods = ctx.client.messages;
		return {
			write: (body: MessageCreateBodyRequest) => methods.write(ctx.id, body),
			edit: (messageId: string, body: MessageUpdateBodyRequest) => methods.edit(messageId, ctx.id, body),
			crosspost: (messageId: string, reason?: string) => methods.crosspost(messageId, ctx.id, reason),
			delete: (messageId: string, reason?: string) => methods.delete(messageId, ctx.id, reason),
			fetch: (messageId: string) => methods.fetch(messageId, ctx.id),
			purge: (messages: string[], reason?: string) => methods.purge(messages, ctx.id, reason),
		};
	}

	static reactions(ctx: MethodContext<{ id: string }>) {
		const methods = ctx.client.messages.reactions;
		return {
			add: (messageId: string, emoji: EmojiResolvable) => methods.add(messageId, ctx.id, emoji),
			delete: (messageId: string, emoji: EmojiResolvable, userId = '@me') =>
				methods.delete(messageId, ctx.id, emoji, userId),
			fetch: (
				messageId: string,

				emoji: EmojiResolvable,
				query?: RESTGetAPIChannelMessageReactionUsersQuery,
			) => methods.fetch(messageId, ctx.id, emoji, query),
			purge: (messageId: string, emoji?: EmojiResolvable) => methods.purge(messageId, ctx.id, emoji),
		};
	}
	static pins(ctx: MethodContext<{ id: string }>) {
		const methods = ctx.client.channels.pins;
		return {
			fetch: () => methods.fetch(ctx.id),
			set: (messageId: string, reason?: string) => methods.set(messageId, ctx.id, reason),
			delete: (messageId: string, reason?: string) => methods.delete(messageId, ctx.id, reason),
		};
	}

	static transformMessageBody<T>(body: MessageCreateBodyRequest | MessageUpdateBodyRequest) {
		return {
			...body,
			components: body.components
				? (body?.components instanceof ComponentsListener ? body.components.components : body.components).map(x =>
						x.toJSON(),
				  )
				: undefined,
			embeds: body.embeds?.map(x => (x instanceof MessageEmbed ? x.toJSON() : x)) ?? undefined,
			//?
			attachments: body.attachments?.map((x, i) => ({ id: i, ...resolveAttachment(x) })) ?? undefined,
		} as T;
	}
}

export interface TextBaseChannel extends ObjectToLower<APITextChannel>, MessagesMethods {}
@mix(MessagesMethods)
export class TextBaseChannel extends BaseGuildChannel {}

export default function channelFrom(data: APIChannelBase<ChannelType>, client: BaseClient): AllChannels {
	switch (data.type) {
		case ChannelType.GuildStageVoice:
			return new StageChannel(client, data);
		case ChannelType.GuildMedia:
			return new MediaChannel(client, data);
		case ChannelType.DM:
			return new DMChannel(client, data);
		case ChannelType.GuildForum:
			return new ForumChannel(client, data);
		case ChannelType.AnnouncementThread:
		case ChannelType.PrivateThread:
		case ChannelType.PublicThread:
			return new ThreadChannel(client, data);
		case ChannelType.GuildDirectory:
			return new DirectoryChannel(client, data);
		case ChannelType.GuildVoice:
			return new VoiceChannel(client, data);
		case ChannelType.GuildText:
			return new TextGuildChannel(client, data);
		case ChannelType.GuildCategory:
			return new CategoryChannel(client, data);
		case ChannelType.GuildAnnouncement:
			return new NewsChannel(client, data);
		default:
			if ('guild_id' in data) {
				return new BaseGuildChannel(client, data);
			}
			return new BaseChannel(client, data);
	}
}

export interface TopicableGuildChannel extends BaseChannel<ChannelType> {}
export class TopicableGuildChannel extends DiscordBase {
	setTopic(topic: string | null, reason?: string) {
		return this.edit({ topic }, reason);
	}
}

export interface ThreadOnlyMethods extends BaseChannel<ChannelType.PublicThread | ChannelType.PrivateThread> {}
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

export class VoiceChannelMethods extends BaseChannel<ChannelType.GuildVoice> {
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

export class WebhookGuildMethods extends DiscordBase {
	webhooks = WebhookGuildMethods.guild({ client: this.client, guildId: this.id });

	static guild(ctx: MethodContext<{ guildId: string }>) {
		return {
			list: async () => {
				const webhooks = await ctx.client.proxy.guilds(ctx.guildId).webhooks.get();
				return webhooks.map(webhook => new Webhook(ctx.client, webhook));
			},
		};
	}
}

export class WebhookChannelMethods extends DiscordBase {
	webhooks = WebhookChannelMethods.channel({ client: this.client, channelId: this.id });

	static channel(ctx: MethodContext<{ channelId: string }>) {
		return {
			list: async () => {
				const webhooks = await ctx.client.proxy.channels(ctx.channelId).webhooks.get();
				return webhooks.map(webhook => new Webhook(ctx.client, webhook));
			},
			create: async (body: RESTPostAPIChannelWebhookJSONBody) => {
				const webhook = await ctx.client.proxy.channels(ctx.channelId).webhooks.post({
					body,
				});
				return new Webhook(ctx.client, webhook);
			},
		};
	}
}
