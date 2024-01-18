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
	type AllGuildTextableChannels,
	type AllTextableChannels,
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

	isStage(): this is StageChannel {
		return this.type === ChannelType.GuildStageVoice;
	}

	isMedia(): this is MediaChannel {
		return this.type === ChannelType.GuildMedia;
	}

	isDM(): this is DMChannel {
		return [ChannelType.DM, ChannelType.GroupDM].includes(this.type);
	}

	isForum(): this is ForumChannel {
		return this.type === ChannelType.GuildForum;
	}

	isThread(): this is ThreadChannel {
		return [
			ChannelType.PublicThread,
			ChannelType.PrivateThread,
			ChannelType.AnnouncementThread,
		].includes(this.type);
	}

	isDirectory(): this is DirectoryChannel {
		return this.type === ChannelType.GuildDirectory;
	}

	isVoice(): this is VoiceChannel {
		return this.type === ChannelType.GuildVoice;
	}

	isTextGuild(): this is TextGuildChannel {
		return this.type === ChannelType.GuildText;
	}

	isCategory(): this is CategoryChannel {
		return this.type === ChannelType.GuildCategory;
	}

	isNews(): this is NewsChannel {
		return this.type === ChannelType.GuildAnnouncement;
	}

	isTextable(): this is AllTextableChannels {
		return 'messages' in this;
	}

	isGuildTextable(): this is AllGuildTextableChannels {
		return !this.isDM() && this.isTextable()
	}

	isThreadOnly(): this is ForumChannel | MediaChannel {
		return this.isForum() || this.isMedia();
	}

	static allMethods(ctx: MethodContext<{ guildId: string }>) {
		return {
			list: (force = false) => ctx.client.guilds.channels.list(ctx.guildId, force),
			fetch: (id: string, force = false) => ctx.client.guilds.channels.fetch(ctx.guildId, id, force),
			create: (body: RESTPostAPIGuildChannelJSONBody) => ctx.client.guilds.channels.create(ctx.guildId, body),
			delete: (id: string, reason?: string) => ctx.client.guilds.channels.delete(ctx.guildId, id, reason),
			edit: (id: string, body: RESTPatchAPIChannelJSONBody, reason?: string) =>
				ctx.client.guilds.channels.edit(ctx.guildId, id, body, reason),
			editPositions: (body: RESTPatchAPIGuildChannelPositionsJSONBody) =>
				ctx.client.guilds.channels.editPositions(ctx.guildId, body),
		};
	}
}

export interface BaseGuildChannel extends ObjectToLower<APIGuildChannel<ChannelType.GuildText>> { }
export class BaseGuildChannel extends BaseChannel<ChannelType.GuildText> {
	async guild(force?: true): Promise<Guild<'api'>>;
	async guild(force?: boolean): Promise<Guild<'cached'> | Guild<'api'>>;
	async guild(force = false) {
		return this.client.guilds.fetch(this.guildId!, force);
	}

	get url() {
		return channelLink(this.id, this.guildId);
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

export interface MessagesMethods extends BaseChannel<ChannelType.GuildText> { }
export class MessagesMethods extends DiscordBase {
	typing() {
		return this.client.channels.typing(this.id);
	}

	messages = MessagesMethods.messages({ client: this.client, id: this.id });
	pins = MessagesMethods.pins({ client: this.client, id: this.id });
	reactions = MessagesMethods.reactions({ client: this.client, id: this.id });

	static messages(ctx: MethodContext<{ id: string }>) {
		return {
			write: (body: MessageCreateBodyRequest) => ctx.client.messages.write(ctx.id, body),
			edit: (messageId: string, body: MessageUpdateBodyRequest) => ctx.client.messages.edit(messageId, ctx.id, body),
			crosspost: (messageId: string, reason?: string) => ctx.client.messages.crosspost(messageId, ctx.id, reason),
			delete: (messageId: string, reason?: string) => ctx.client.messages.delete(messageId, ctx.id, reason),
			fetch: (messageId: string) => ctx.client.messages.fetch(messageId, ctx.id),
			purge: (messages: string[], reason?: string) => ctx.client.messages.purge(messages, ctx.id, reason),
		};
	}

	static reactions(ctx: MethodContext<{ id: string }>) {
		return {
			add: (messageId: string, emoji: EmojiResolvable) => ctx.client.messages.reactions.add(messageId, ctx.id, emoji),
			delete: (messageId: string, emoji: EmojiResolvable, userId = '@me') =>
				ctx.client.messages.reactions.delete(messageId, ctx.id, emoji, userId),
			fetch: (messageId: string, emoji: EmojiResolvable, query?: RESTGetAPIChannelMessageReactionUsersQuery) =>
				ctx.client.messages.reactions.fetch(messageId, ctx.id, emoji, query),
			purge: (messageId: string, emoji?: EmojiResolvable) =>
				ctx.client.messages.reactions.purge(messageId, ctx.id, emoji),
		};
	}
	static pins(ctx: MethodContext<{ id: string }>) {
		return {
			fetch: () => ctx.client.channels.pins.fetch(ctx.id),
			set: (messageId: string, reason?: string) => ctx.client.channels.pins.set(messageId, ctx.id, reason),
			delete: (messageId: string, reason?: string) => ctx.client.channels.pins.delete(messageId, ctx.id, reason),
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

export interface TextBaseChannel extends ObjectToLower<APITextChannel>, MessagesMethods { }
@mix(MessagesMethods)
export class TextBaseChannel extends BaseGuildChannel { }

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

export interface TopicableGuildChannel extends BaseChannel<ChannelType> { }
export class TopicableGuildChannel extends DiscordBase {
	setTopic(topic: string | null, reason?: string) {
		return this.edit({ topic }, reason);
	}
}

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
