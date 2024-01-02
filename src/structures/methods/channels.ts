import { mix } from 'ts-mixer';
import {
	APIGuildChannel,
	CategoryChannel,
	DMChannel,
	DirectoryChannel,
	ForumChannel,
	Guild,
	MediaChannel,
	Message,
	NewsChannel,
	PotocuitChannels,
	RawFile,
	StageChannel,
	TextGuildChannel,
	ThreadChannel,
	VoiceChannel,
	Webhook,
	channelLink,
	encodeEmoji,
	resolveEmoji,
} from '../..';
import { BaseClient } from '../../client/base';
import {
	APIChannelBase,
	APIGuildForumDefaultReactionEmoji,
	APIGuildForumTag,
	APITextChannel,
	ChannelType,
	EmojiResolvable,
	MessageCreateBodyRequest,
	MessageUpdateBodyRequest,
	MethodContext,
	ObjectToLower,
	RESTGetAPIChannelMessageReactionUsersQuery,
	RESTPatchAPIChannelJSONBody,
	RESTPatchAPIChannelMessageJSONBody,
	RESTPatchAPIGuildChannelPositionsJSONBody,
	RESTPostAPIChannelMessageJSONBody,
	RESTPostAPIChannelMessagesBulkDeleteJSONBody,
	RESTPostAPIChannelWebhookJSONBody,
	RESTPostAPIGuildChannelJSONBody,
	SortOrderType,
	ThreadAutoArchiveDuration,
	VideoQualityMode,
} from '../../common';
import { User } from '../User';
import { DiscordBase } from '../extra/DiscordBase';

export class BaseChannel<T extends ChannelType> extends DiscordBase<APIChannelBase<ChannelType>> {
	declare type: T;
	private readonly __methods__!: ReturnType<typeof BaseChannel.allMethods>;

	constructor(client: BaseClient, data: APIChannelBase<ChannelType>) {
		super(client, data);
		Object.assign(this, {
			__methods__: BaseChannel.allMethods({ client, guildId: this.__guildId__ }),
		});
	}

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
		return this.__methods__.fetch(this.id, force)
	}

	delete(reason?: string) {
		return this.__methods__.delete(this.id, reason);
	}

	edit(body: RESTPatchAPIChannelJSONBody, reason?: string) {
		return this.__methods__.edit(this.id, body, reason)
	}

	toString() {
		return `<#${this.id}>`;
	}

	static globalMethods(ctx: MethodContext) {
		return {
			fetch: async (id: string, force?: boolean) => {
				let channel;
				if (!force) {
					channel = await ctx.client.cache.channels?.get(id);
					if (channel) return channel;
				}

				channel = await ctx.client.proxy.channels(id).get();
				await ctx.client.cache.channels?.patch(id, undefined, channel);
				return channelFrom(channel, ctx.client);
			},
		};
	}

	static allMethods(ctx: MethodContext<{ guildId: string }>) {
		return {
			list: async (force = false) => {
				let channels;
				if (!force) {
					channels = (await ctx.client.cache.channels?.values(ctx.guildId)) ?? [];
					if (channels.length) {
						return channels;
					}
				}
				channels = await ctx.client.proxy.guilds(ctx.guildId).channels.get();
				await ctx.client.cache.channels?.set(
					channels.map((x) => [x!.id, x]),
					ctx.guildId,
				);
				return channels.map((m) => channelFrom(m, ctx.client));
			},
			fetch: async (id: string, force?: boolean) => {
				let channel;
				if (!force) {
					channel = await ctx.client.cache.channels?.get(id);
					if (channel) return channel;
				}

				channel = await ctx.client.proxy.channels(id).get();
				await ctx.client.cache.channels?.patch(id, ctx.guildId, channel);
				return channelFrom(channel, ctx.client);
			},
			create: async (body: RESTPostAPIGuildChannelJSONBody) => {
				const res = await ctx.client.proxy.guilds(ctx.guildId).channels.post({ body });
				await ctx.client.cache.channels?.setIfNI(BaseChannel.__intent__(ctx.guildId), res.id, ctx.guildId, res);
				return channelFrom(res, ctx.client);
			},
			delete: async (id: string, reason?: string) => {
				if (!id) {
					throw new Error('No channelId');
				}
				const res = await ctx.client.proxy.channels(id).delete({ reason });
				await ctx.client.cache.channels?.removeIfNI(BaseChannel.__intent__(ctx.guildId), res.id, ctx.guildId);
				return channelFrom(res, ctx.client);
			},
			edit: async (id: string, body: RESTPatchAPIChannelJSONBody, reason?: string) => {
				const res = await ctx.client.proxy.channels(id).patch({ body, reason });
				await ctx.client.cache.channels?.setIfNI(BaseChannel.__intent__(ctx.guildId), res.id, ctx.guildId, res);
				return channelFrom(res, ctx.client);
			},
			editPositions: (body: RESTPatchAPIGuildChannelPositionsJSONBody) =>
				ctx.client.proxy.guilds(ctx.guildId).channels.patch({ body }),
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
		return this.api.channels(this.id).typing.post();
	}

	messages = MessagesMethods.messages({ client: this.client, channelId: this.id });
	pins = MessagesMethods.pins({ client: this.client, channelId: this.id });
	reactions = MessagesMethods.reactions({ client: this.client, channelId: this.id });
	static reactions(ctx: MethodContext<{ channelId: string }>) {
		return {
			add: async (messageId: string, emoji: EmojiResolvable) => {
				const rawEmoji = await resolveEmoji(emoji, ctx.client.cache);

				if (!rawEmoji) {
					throw new Error('Emoji no resolvable');
				}

				return ctx.client.proxy
					.channels(ctx.channelId)
					.messages(messageId)
					.reactions(encodeEmoji(rawEmoji))('@me')
					.put({});
			},
			delete: async (messageId: string, emoji: EmojiResolvable, userId = '@me') => {
				const rawEmoji = await resolveEmoji(emoji, ctx.client.cache);

				if (!rawEmoji) {
					throw new Error('Emoji no resolvable');
				}

				return ctx.client.proxy
					.channels(ctx.channelId)
					.messages(messageId)
					.reactions(encodeEmoji(rawEmoji))(userId)
					.delete();
			},
			fetch: async (messageId: string, emoji: EmojiResolvable, query?: RESTGetAPIChannelMessageReactionUsersQuery) => {
				const rawEmoji = await resolveEmoji(emoji, ctx.client.cache);

				if (!rawEmoji) {
					throw new Error('Emoji no resolvable');
				}

				return ctx.client.proxy
					.channels(ctx.channelId)
					.messages(messageId)
					.reactions(encodeEmoji(rawEmoji))
					.get({ query })
					.then((u) => u.map((user) => new User(ctx.client, user)));
			},
			purge: async (messageId: string, emoji?: EmojiResolvable) => {
				if (!emoji) {
					return ctx.client.proxy.channels(ctx.channelId).messages(messageId).reactions.delete();
				}
				const rawEmoji = await resolveEmoji(emoji, ctx.client.cache);

				if (!rawEmoji) {
					throw new Error('Emoji no resolvable');
				}

				return ctx.client.proxy.channels(ctx.channelId).messages(messageId).reactions(encodeEmoji(rawEmoji)).delete();
			},
		};
	}

	static pins(ctx: MethodContext<{ channelId: string }>) {
		return {
			fetch: () =>
				ctx.client.proxy
					.channels(ctx.channelId)
					.pins.get()
					.then((messages) => messages.map((message) => new Message(ctx.client, message))),
			set: (messageId: string, reason?: string) =>
				ctx.client.proxy.channels(ctx.channelId).pins(messageId).put({ reason }),
			delete: (messageId: string, reason?: string) =>
				ctx.client.proxy.channels(ctx.channelId).pins(messageId).delete({ reason }),
		};
	}

	static transformMessageBody<T>(body: MessageCreateBodyRequest | MessageUpdateBodyRequest) {
		return {
			...body,
			components: body.components ? body.components.map((x) => x.toJSON()) : [],
		} as T;
	}

	static messages(ctx: MethodContext<{ channelId: string }>) {
		return {
			write: (body: MessageCreateBodyRequest, files?: RawFile[]) => {
				const transformedBody = MessagesMethods.transformMessageBody<RESTPostAPIChannelMessageJSONBody>(body);
				return ctx.client.proxy
					.channels(ctx.channelId)
					.messages.post({
						body: transformedBody,
						files,
					})
					.then((message) => {
						ctx.client.components.onRequestMessage(body, message);
						return new Message(ctx.client, message);
					});
			},
			edit: (messageId: string, body: MessageUpdateBodyRequest, files?: RawFile[]) => {
				return ctx.client.proxy
					.channels(ctx.channelId)
					.messages(messageId)
					.patch({
						body: MessagesMethods.transformMessageBody<RESTPatchAPIChannelMessageJSONBody>(body),
						files,
					})
					.then((message) => {
						ctx.client.components.onRequestUpdateMessage(body, message);
						return new Message(ctx.client, message);
					});
			},
			crosspost: (messageId: string, reason?: string) => {
				return ctx.client.proxy
					.channels(ctx.channelId)
					.messages(messageId)
					.crosspost.post({ reason })
					.then((m) => new Message(ctx.client, m));
			},
			delete: (messageId: string, reason?: string) => {
				return ctx.client.proxy
					.channels(ctx.channelId)
					.messages(messageId)
					.delete({ reason })
					.then(() => {
						return ctx.client.components.onMessageDelete(messageId);
					});
			},
			fetch: async (messageId: string) => {
				return ctx.client.proxy
					.channels(ctx.channelId)
					.messages(messageId)
					.get()
					.then((x) => new Message(ctx.client, x));
			},
			purge: (body: RESTPostAPIChannelMessagesBulkDeleteJSONBody, reason?: string) => {
				return ctx.client.proxy.channels(ctx.channelId).messages['bulk-delete'].post({ body, reason });
			},
		};
	}
}

export interface TextBaseChannel extends ObjectToLower<APITextChannel>, MessagesMethods { }
@mix(MessagesMethods)
export class TextBaseChannel extends BaseGuildChannel { }

export default function channelFrom(data: APIChannelBase<ChannelType>, client: BaseClient): PotocuitChannels {
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
				return webhooks.map((webhook) => new Webhook(ctx.client, webhook));
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
				return webhooks.map((webhook) => new Webhook(ctx.client, webhook));
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
