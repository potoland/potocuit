// import type { BiscuitChannels } from '../index';

import type { APIChannel, APIChannelBase, APITextChannel, ChannelType, ObjectToLower, RESTGetAPIGuildChannelsResult, RESTPatchAPIChannelJSONBody, RESTPatchAPIGuildChannelPositionsJSONBody, RESTPostAPIGuildChannelJSONBody } from '@biscuitland/common';
import { channelLink } from '../../../structures/extra/functions';
import { DiscordBase } from '../../extra/DiscordBase';
import type { MethodContext } from '../../../types';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../../../cache';
import type { PotocuitChannels } from '../../channels';
import { mix } from 'ts-mixer';
import { MessagesMethods } from './messages';

// export interface BaseChannel extends ObjectToLower<APIChannelBase<ChannelType>> { }
export class BaseChannel<T extends ChannelType> extends DiscordBase<APIChannelBase<ChannelType>> {
	declare type: T;
	private readonly __methods__!: ReturnType<typeof BaseChannel.methods>;

	constructor(
		rest: BiscuitREST,
		cache: Cache,
		data: APIChannelBase<ChannelType>,
	) {
		super(rest, cache, data);
		Object.defineProperty(this, '__methods__', {
			value: BaseChannel.methods({ id: this.__guildId__, rest: this.rest, api: this.api, cache: this.cache, channelId: this.id }),
			writable: false,
		});
	}

	private get __guildId__() {
		return 'guildId' in this ? this.guildId as string : '@me';
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
		return this.__methods__.edit(this.id, body, reason).then(this._patchThis);
	}

	toString() {
		return `<#${this.id}>`;
	}

	static from(data: APIChannelBase<ChannelType>, rest: BiscuitREST, cache: Cache): PotocuitChannels {
		switch (data.type) {
			default:
				if ('guild_id' in data) { return new BaseGuildChannel(rest, cache, data); }
				return new BaseChannel(rest, cache, data);
		}
	}

	static methods(ctx: MethodContext<{ channelId?: string }>) {
		return {
			list: async (force = false) => {
				let channels: RESTGetAPIGuildChannelsResult;
				if (!force) {
					channels = await ctx.cache.channels?.values(ctx.id) ?? [];
					if (channels.length) { return channels.map(m => BaseChannel.from(m, ctx.rest, ctx.cache)); }
				}
				channels = await ctx.api.guilds(ctx.id).channels.get();
				await ctx.cache.channels?.set(channels.map(x => [x!.id, x]), ctx.id);
				return channels.map(m => BaseChannel.from(m, ctx.rest, ctx.cache));
			},
			fetch: async (channelId = ctx.channelId, force?: boolean) => {
				if (!channelId) { throw new Error('No channelId'); }
				let channel: APIChannel;
				if (!force) {
					channel = await ctx.cache.channels?.get(channelId);
					if (channel) { return channel; }
				}
				channel = await ctx.api.channels(channelId).get();
				await ctx.cache.channels?.patch(channelId, ctx.id, channel);
				return channel;
			},
			create: (body: RESTPostAPIGuildChannelJSONBody) =>
				ctx.api.guilds(ctx.id).channels.post({ body })
					.then(res => ctx.cache.channels?.setIfNI(BaseChannel.__intent__(ctx.id), res.id, ctx.id, res).then(cacheRes => cacheRes ?? res)),
			delete: (channelId = ctx.channelId, reason?: string) => {
				if (!channelId) { throw new Error('No channelId'); }
				return ctx.api.channels(channelId).delete({ reason })
					.then(res => ctx.cache.channels?.removeIfNI(BaseChannel.__intent__(ctx.id), res.id, ctx.id));
			},
			edit: (channelId = ctx.channelId, body: RESTPatchAPIChannelJSONBody, reason?: string) => {
				if (!channelId) { throw new Error('No channelId'); }
				return ctx.api.channels(channelId).patch({ body, reason })
					.then(res => ctx.cache.channels?.setIfNI(BaseChannel.__intent__(ctx.id), res.id, ctx.id, res).then(x => x ?? res));
			},
			// 204
			editPositions: (body: RESTPatchAPIGuildChannelPositionsJSONBody) => ctx.api.guilds(ctx.id).channels.patch({ body })
		};
	}
}

// xd
// a y el setRatelimitPeruser, njo lo tiene el news, solo el text yeah
export class BaseGuildChannel extends BaseChannel<ChannelType.GuildText> {
	setPosition(position: number, reason?: string) {
		return this.edit({ position }, reason);
	}

	setName(name: string, reason?: string) {
		return this.edit({ name }, reason);
	}

	// y si,tipo, magia negra :pleading:
	// como debe de ser
	setParent(parent_id: string | null, reason?: string) {
		return this.edit({ parent_id }, reason);
	}
	// por eso te dije que necesitabamos un mixin que ignorara props ddjsdkjdkasdjkasdladjaskldjaskld
}
// no tienes que omitirlo api text channel tiene de type GuildText
export interface TextBaseChannel extends ObjectToLower<APITextChannel>, MessagesMethods { }
@mix(MessagesMethods)
export class TextBaseChannel extends BaseGuildChannel { }
