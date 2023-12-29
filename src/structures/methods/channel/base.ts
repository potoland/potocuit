import type {
	APIChannel,
	APIChannelBase,
	APITextChannel,
	ObjectToLower,
	RESTGetAPIGuildChannelsResult,
	RESTPatchAPIChannelJSONBody,
	RESTPatchAPIGuildChannelPositionsJSONBody,
	RESTPostAPIGuildChannelJSONBody,
} from '@biscuitland/common';
import { ChannelType } from '@biscuitland/common';
import { mix } from 'ts-mixer';
import type { BaseClient } from '../../../client/base';
import {
	CategoryChannel,
	DMChannel,
	DirectoryChannel,
	ForumChannel,
	MediaChannel,
	NewsChannel,
	type PotocuitChannels,
	StageChannel,
	TextGuildChannel,
	ThreadChannel,
	VoiceChannel,
} from '../../../structures/channels';
import { DiscordBase } from '../../../structures/extra/DiscordBase';
import { channelLink } from '../../../structures/extra/functions';
import type { MethodContext } from '../../../types';
import { MessagesMethods } from './messages';

export class BaseChannel<T extends ChannelType> extends DiscordBase<APIChannelBase<ChannelType>> {
	declare type: T;
	private readonly __methods__!: ReturnType<typeof BaseChannel.methods>;

	constructor(client: BaseClient, data: APIChannelBase<ChannelType>) {
		super(client, data);
		Object.assign(this, {
			__methods__: BaseChannel.methods({ client, id: this.__guildId__, api: this.api, channelId: this.id }),
		});
	}

	private get __guildId__() {
		return 'guildId' in this ? (this.guildId as string) : '@me';
	}

	static __intent__(id: string) {
		return id === '@me' ? 'DirectMessages' : 'Guilds';
	}

	/** The URL to the channel */
	get url() {
		return channelLink(this.id);
	}

	fetch(force = false) {
		return this.__methods__.fetch(this.id, force).then(this._patchThis);
	}

	delete(reason?: string) {
		return this.__methods__.delete(this.id, reason);
	}

	edit(body: RESTPatchAPIChannelJSONBody, reason?: string) {
		return this.__methods__.edit({ ...body, channelId: this.id }, reason).then(this._patchThis);
	}

	toString() {
		return `<#${this.id}>`;
	}

	static from(data: APIChannelBase<ChannelType>, client: BaseClient): PotocuitChannels {
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

	static methods(ctx: MethodContext<{ channelId?: string }>) {
		return {
			list: async (force = false) => {
				let channels: RESTGetAPIGuildChannelsResult;
				if (!force) {
					channels = (await ctx.client.cache.channels?.values(ctx.id)) ?? [];
					if (channels.length) {
						return channels.map((m) => BaseChannel.from(m, ctx.client));
					}
				}
				channels = await ctx.api.guilds(ctx.id).channels.get();
				await ctx.client.cache.channels?.set(
					channels.map((x) => [x!.id, x]),
					ctx.id,
				);
				return channels.map((m) => BaseChannel.from(m, ctx.client));
			},
			fetch: async (channelId = ctx.channelId, force?: boolean) => {
				if (!channelId) {
					throw new Error('No channelId');
				}
				let channel: APIChannel;
				if (!force) {
					channel = await ctx.client.cache.channels?.get(channelId);
					if (channel) {
						return BaseChannel.from(channel, ctx.client);
					}
				}
				channel = await ctx.api.channels(channelId).get();
				await ctx.client.cache.channels?.patch(channelId, ctx.id, channel);
				return BaseChannel.from(channel, ctx.client);
			},
			create: async (body: RESTPostAPIGuildChannelJSONBody) => {
				const res = await ctx.api.guilds(ctx.id).channels.post({ body });
				await ctx.client.cache.channels?.setIfNI(BaseChannel.__intent__(ctx.id), res.id, ctx.id, res);
				return BaseChannel.from(res, ctx.client);
			},
			delete: async (channelId = ctx.channelId, reason?: string) => {
				if (!channelId) {
					throw new Error('No channelId');
				}
				const res = await ctx.api.channels(channelId).delete({ reason });
				await ctx.client.cache.channels?.removeIfNI(BaseChannel.__intent__(ctx.id), res.id, ctx.id);
				return BaseChannel.from(res, ctx.client);
			},
			edit: async (
				body: RESTPatchAPIChannelJSONBody & { channelId?: string } = { channelId: ctx.channelId },
				reason?: string,
			) => {
				if (!body.channelId) {
					throw new Error('No channelId');
				}
				const res = await ctx.api.channels(body.channelId).patch({ body, reason });
				await ctx.client.cache.channels?.setIfNI(BaseChannel.__intent__(ctx.id), res.id, ctx.id, res);
				return BaseChannel.from(res, ctx.client);
			},
			editPositions: (body: RESTPatchAPIGuildChannelPositionsJSONBody) =>
				ctx.api.guilds(ctx.id).channels.patch({ body }),
		};
	}
}

export class BaseGuildChannel extends BaseChannel<ChannelType.GuildText> {
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

export interface TextBaseChannel extends ObjectToLower<APITextChannel>, MessagesMethods {}
@mix(MessagesMethods)
export class TextBaseChannel extends BaseGuildChannel {}
