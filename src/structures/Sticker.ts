import type { APISticker, ObjectToLower, RESTPatchAPIGuildStickerJSONBody, RESTPostAPIGuildStickerFormDataBody } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { User } from './User';
import { DiscordBase } from './extra/DiscordBase';
import type { Cache } from '../cache';
import { MethodContext } from '../types';

export interface Sticker extends DiscordBase, ObjectToLower<Omit<APISticker, 'user'>> { }

export class Sticker extends DiscordBase {
	private readonly __methods__!: ReturnType<typeof Sticker.methods>
	user?: User;

	constructor(rest: BiscuitREST, cache: Cache, data: APISticker) {
		super(rest, cache, data);
		if (data.user) {
			this.user = new User(this.rest, cache, data.user);
		}
		if (this.guildId) {
			Object.defineProperty(this, '__methods__', {
				value: Sticker.methods({ rest, cache, id: this.guildId, api: this.api, stickerId: this.id }),
			})
		}
	}

	edit(body: RESTPatchAPIGuildStickerJSONBody, reason?: string) {
		return this.__methods__.edit(body, reason)
	}

	fetch(force = false) {
		return this.__methods__.fetch(force)
	}

	delete(reason?: string) {
		return this.__methods__.delete(reason)
	}


	static methods(ctx: MethodContext<{ stickerId?: string }>) {
		return {
			list: async () => {
				const stickers = await ctx.api.guilds(ctx.id).stickers.get();
				await ctx.cache.stickers?.set(stickers.map(st => [st.id, st]), ctx.id);
				return stickers.map(st => new Sticker(ctx.rest, ctx.cache, st));
			},
			create: async (body: RESTPostAPIGuildStickerFormDataBody, reason?: string) => {
				const { file, ...json } = body;
				// @ts-expect-error esta wea hay que arreglarla, poner un file resolvable y bla bla bla
				const sticker = await ctx.api.guilds(ctx.id).stickers.post({ reason, body: json, files: [{ ...file, key: 'file' }], appendToFormData: true });
				await ctx.cache.stickers?.setIfNI('GuildEmojisAndStickers', sticker.id, ctx.id, sticker);
				return new Sticker(ctx.rest, ctx.cache, sticker);
			},
			edit: async (body: RESTPatchAPIGuildStickerJSONBody, reason?: string, id = ctx.stickerId) => {
				if (!id) throw new Error('No sticker id');
				const sticker = await ctx.api.guilds(ctx.id).stickers(id).patch({ body, reason });
				await ctx.cache.stickers?.setIfNI('GuildEmojisAndStickers', id, ctx.id, sticker);
				return new Sticker(ctx.rest, ctx.cache, sticker);
			},
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
			delete: async (reason?: string, id = ctx.id) => {
				await ctx.api.guilds(ctx.id).stickers(id).delete({ reason });
				await ctx.cache.stickers?.removeIfNI('GuildEmojisAndStickers', id, ctx.id);
			}
		}
	}
}

