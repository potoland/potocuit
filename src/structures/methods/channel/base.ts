// import type { BiscuitChannels } from '../index';

import type { APIChannel, APIChannelBase, ChannelType, RESTGetAPIGuildChannelsResult, RESTPatchAPIChannelJSONBody, RESTPatchAPIGuildChannelPositionsJSONBody, RESTPostAPIGuildChannelJSONBody } from '@biscuitland/common';
import { channelLink } from '../../../structures/extra/functions';
import { DiscordBase } from '../../extra/DiscordBase';
import { MethodContext } from '../../../types';
import { BiscuitREST } from '@biscuitland/rest';
import { Cache } from '../../../cache';
import { BaseGuildChannel, PotocuitChannels } from '../../channels';

// export interface BaseChannel extends ObjectToLower<APIChannelBase<ChannelType>> { }

export class BaseChannel extends DiscordBase<APIChannelBase<ChannelType>> {
	private readonly __methods__!: ReturnType<typeof BaseChannel.methods>

	constructor(
		rest: BiscuitREST,
		cache: Cache,
		data: APIChannelBase<ChannelType>,
	) {
		super(rest, cache, data);
		Object.defineProperty(this, '__methods__', {
			value: BaseChannel.methods({ id: this.__guildId__, rest: this.rest, api: this.api, cache: this.cache, channelId: this.id }),
			writable: false,
		})
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
				if ('guild_id' in data) return new BaseGuildChannel(rest, cache, data);
				return new BaseChannel(rest, cache, data)
		}
	}

	static methods(ctx: MethodContext<{ channelId?: string }>) {
		return {
			list: async (force = false) => {
				let channels: RESTGetAPIGuildChannelsResult;
				if (!force) {
					channels = await ctx.cache.channels?.values(ctx.id) ?? [];
					if (channels.length) return channels.map(m => BaseChannel.from(m, ctx.rest, ctx.cache));
				}
				channels = await ctx.api.guilds(ctx.id).channels.get();
				await ctx.cache.channels?.set(channels.map(x => [x!.id, x]), ctx.id);
				return channels.map(m => BaseChannel.from(m, ctx.rest, ctx.cache));
			},
			fetch: async (channelId = ctx.channelId, force?: boolean) => {
				if (!channelId) throw new Error('No channelId')
				let channel: APIChannel;
				if (!force) {
					channel = await ctx.cache.channels?.get(channelId);
					if (channel) return channel;
				}
				channel = await ctx.api.channels(channelId).get();
				await ctx.cache.channels?.patch(channelId, ctx.id, channel);
				return channel;
			},
			create: (body: RESTPostAPIGuildChannelJSONBody) =>
				ctx.api.guilds(ctx.id).channels.post({ body })
					.then(res => ctx.cache.channels?.setIfNI(BaseChannel.__intent__(ctx.id), res.id, ctx.id, res).then(cacheRes => cacheRes ?? res)),
			delete: (channelId = ctx.channelId, reason?: string) => {
				if (!channelId) throw new Error('No channelId')
				return ctx.api.channels(channelId).delete({ reason })
					.then(res => ctx.cache.channels?.removeIfNI(BaseChannel.__intent__(ctx.id), res.id, ctx.id))
			},
			edit: (channelId = ctx.channelId, body: RESTPatchAPIChannelJSONBody, reason?: string) => {
				if (!channelId) throw new Error('No channelId')
				return ctx.api.channels(channelId).patch({ body, reason })
					.then(res => ctx.cache.channels?.setIfNI(BaseChannel.__intent__(ctx.id), res.id, ctx.id, res).then(x => x ?? res))
			},
			//204
			editPositions: (body: RESTPatchAPIGuildChannelPositionsJSONBody) => ctx.api.guilds(ctx.id).channels.patch({ body })
		}
	}
}
