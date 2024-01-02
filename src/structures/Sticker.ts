import type { BaseClient } from '../client/base';
import type {
	APISticker,
	MethodContext,
	ObjectToLower,
	RESTPatchAPIGuildStickerJSONBody,
	RESTPostAPIGuildStickerFormDataBody,
} from '../common';
import { Guild } from './Guild';
import { User } from './User';
import { DiscordBase } from './extra/DiscordBase';

export interface Sticker extends DiscordBase, ObjectToLower<Omit<APISticker, 'user'>> {}

export class Sticker extends DiscordBase {
	private readonly __methods__!: ReturnType<typeof Sticker.methods>;
	user?: User;

	constructor(client: BaseClient, data: APISticker) {
		super(client, data);
		if (data.user) {
			this.user = new User(this.client, data.user);
		}
		if (this.guildId) {
			Object.assign(this, {
				__methods__: Sticker.methods({ client, id: this.guildId, stickerId: this.id }),
			});
		}
	}

	async guild(force?: true): Promise<Guild<'api'> | undefined>;
	async guild(force = false) {
		if (!this.guildId) return;
		return this.client.guilds.fetch(this.id, force);
	}

	edit(body: RESTPatchAPIGuildStickerJSONBody, reason?: string) {
		return this.__methods__.edit(body, reason);
	}

	fetch(force = false) {
		return this.__methods__.fetch(force);
	}

	delete(reason?: string) {
		return this.__methods__.delete(reason);
	}

	static methods(ctx: MethodContext<{ stickerId?: string }>) {
		return {
			list: async () => {
				const stickers = await ctx.client.proxy.guilds(ctx.id).stickers.get();
				await ctx.client.cache.stickers?.set(
					stickers.map((st) => [st.id, st]),
					ctx.id,
				);
				return stickers.map((st) => new Sticker(ctx.client, st));
			},
			create: async (body: RESTPostAPIGuildStickerFormDataBody, reason?: string) => {
				const { file, ...json } = body;
				const sticker = await ctx.client.proxy
					.guilds(ctx.id)
					// @ts-expect-error esta wea hay que arreglarla, poner un file resolvable y bla bla bla
					.stickers.post({ reason, body: json, files: [{ ...file, key: 'file' }], appendToFormData: true });
				await ctx.client.cache.stickers?.setIfNI('GuildEmojisAndStickers', sticker.id, ctx.id, sticker);
				return new Sticker(ctx.client, sticker);
			},
			edit: async (body: RESTPatchAPIGuildStickerJSONBody, reason?: string) => {
				if (!ctx.stickerId) {
					throw new Error('No stickerId');
				}
				const sticker = await ctx.client.proxy.guilds(ctx.id).stickers(ctx.stickerId).patch({ body, reason });
				await ctx.client.cache.stickers?.setIfNI('GuildEmojisAndStickers', ctx.stickerId, ctx.id, sticker);
				return new Sticker(ctx.client, sticker);
			},
			fetch: async (force = false) => {
				if (!ctx.stickerId) {
					throw new Error('No stickerId');
				}
				let sticker;
				if (!force) {
					sticker = await ctx.client.cache.stickers?.get(ctx.stickerId);
					if (sticker) return sticker;
				}
				sticker = await ctx.client.proxy.guilds(ctx.id).stickers(ctx.stickerId).get();
				await ctx.client.cache.stickers?.patch(ctx.stickerId, ctx.id, sticker);
				return new Sticker(ctx.client, sticker);
			},
			delete: async (reason?: string) => {
				if (!ctx.stickerId) {
					throw new Error('No stickerId');
				}
				await ctx.client.proxy.guilds(ctx.id).stickers(ctx.stickerId).delete({ reason });
				await ctx.client.cache.stickers?.removeIfNI('GuildEmojisAndStickers', ctx.stickerId, ctx.id);
			},
		};
	}
}
