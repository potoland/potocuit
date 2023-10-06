// import type { BiscuitChannels } from '../index';

import type { APIChannel, APIChannelBase, ChannelType, RESTPatchAPIChannelJSONBody } from '@biscuitland/common';
import { channelLink } from '../../../structures/extra/functions';
import { DiscordBase } from '../../extra/DiscordBase';

// export interface BaseChannel extends ObjectToLower<APIChannelBase<ChannelType>> { }

export class BaseChannel extends DiscordBase<APIChannelBase<ChannelType>> {
	private get __guildId__() {
		return 'guildId' in this ? this.guildId as string : '@me';
	}

	private get __intent__() {
		return this.__guildId__ === '@me' ? 'DirectMessages' : 'Guilds';
	}

	/** The URL to the channel */
	get url() {
		return channelLink(this.id);
	}

	async fetch(force = false) {
		let channel: APIChannel;
		if (!force) {
			channel = await this.cache.channels?.get(this.id);
			if (channel) return this._patchThis(channel);
		}
		channel = await this.api.channels(this.id).get();
		await this.cache.channels?.patch(this.id, this.__guildId__, channel);
		return this._patchCache(channel, 'channels');
	}
	/**

			fetch: async (force = false, id = ctx.stickerId) => {
				if (!id) throw new Error('No sticker id');
				let sticker;
				if (!force) {
					sticker = await ctx.cache.stickers?.get(id);
					if (sticker) return new Sticker(ctx.rest, ctx.cache, sticker);
				}
				sticker = await ctx.api.guilds(ctx.id).stickers(id).get()
				await ctx.cache.stickers?.patch(id, ctx.id, sticker);
				return new Sticker(ctx.rest, ctx.cache, sticker);
			},
	 */

	delete(reason?: string) {
		return this.api.channels(this.id).delete({ reason })
			.then(() => this.cache.channels?.removeIfNI(this.__intent__, this.id, this.__guildId__))
		// .then(() => !this.__intent__ ? this.cache.channels?.remove(this.id, this.__guildId__) : undefined);
	}

	async edit(body: RESTPatchAPIChannelJSONBody) {
		const data = await this.api.
			channels(this.id)
			.patch({ body });
		await this.cache.channels?.setIfNI(this.__intent__, this.id, this.__guildId__, data)
		return this._patchThis(data);
	}

	toString() {
		return `<#${this.id}>`;
	}
}
