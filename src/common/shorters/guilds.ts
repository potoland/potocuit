import {
	GuildWidgetStyle,
	RESTPatchAPIAutoModerationRuleJSONBody,
	RESTPatchAPIChannelJSONBody,
	RESTPatchAPIGuildChannelPositionsJSONBody,
	RESTPatchAPIGuildStickerJSONBody,
	RESTPostAPIAutoModerationRuleJSONBody,
	RESTPostAPIGuildChannelJSONBody,
	RESTPostAPIGuildEmojiJSONBody,
	RESTPostAPIGuildsJSONBody,
	Routes,
} from 'discord-api-types/v10';
import { ObjectToLower, OmitInsert } from '..';
import { ImageResolvable, resolveFiles, resolveImage } from '../../builders';
import { CreateStickerBodyRequest, Guild, GuildEmoji, Sticker } from '../../structures';
import channelFrom, { BaseChannel } from '../../structures/methods/channels';
import { BASE_URL } from '../it/utils';
import { BaseShorter } from './base';

export class GuildShorter extends BaseShorter {
	get guilds() {
		return {
			create: async (body: RESTPostAPIGuildsJSONBody) => {
				const guild = await this.client.proxy.guilds.post({ body });
				await this.client.cache.guilds?.setIfNI('Guilds', guild.id, guild);
				return new Guild<'api'>(this.client, guild);
			},

			fetch: async (id: string, force = false) => {
				if (!force) {
					const guild = await this.client.cache.guilds?.get(id);
					if (guild) return guild;
				}

				const data = await this.client.proxy.guilds(id).get();
				const patched = await this.client.cache.guilds?.set(id, data);
				return new Guild(this.client, patched ?? data);
			},
			widgetURL: (id: string, style?: GuildWidgetStyle) => {
				const params = new URLSearchParams();
				if (style) {
					params.append('style', style);
				}

				return `${BASE_URL}/${Routes.guildWidgetJSON(id)}${params ? `?${params}` : ''}`;
			},
			channels: this.channels,
			moderation: this.moderation,
			stickers: this.stickers,
			emojis: this.emojis
		};
	}

	get emojis() {
		return {
			list: async (guildId: string, force = false) => {
				let emojis;
				if (!force) {
					emojis = (await this.client.cache.emojis?.values(guildId)) ?? [];
					if (emojis.length) {
						return emojis;
					}
				}
				emojis = await this.client.proxy.guilds(guildId).emojis.get();
				await this.client.cache.emojis?.set(
					emojis.map((x) => [x.id!, x]),
					guildId,
				);
				return emojis.map((m) => new GuildEmoji(this.client, m, guildId));
			},
			create: async (guildId: string, body: OmitInsert<RESTPostAPIGuildEmojiJSONBody, 'image', { image: ImageResolvable }>) => {
				const bodyResolved = { ...body, image: (await resolveImage(body.image)) }
				const emoji = await this.client.proxy.guilds(guildId).emojis.post({
					body: bodyResolved
				});
				await this.client.cache.channels?.setIfNI('GuildEmojisAndStickers', emoji.id!, guildId, emoji);
			},
			fetch: async (guildId: string, emojiId: string, force = false) => {
				let emoji;
				if (!force) {
					emoji = await this.client.proxy.guilds(guildId).emojis(emojiId).get();
					if (emoji) return emoji;
				}
				emoji = await this.client.proxy.guilds(guildId).emojis(emojiId).get();
				return new GuildEmoji(this.client, emoji, guildId);
			},
			delete: async (guildId: string, emojiId: string, reason?: string) => {
				await this.client.proxy.guilds(guildId).emojis(emojiId).delete({ reason });
				await this.client.cache.channels?.removeIfNI('GuildEmojisAndStickers', emojiId, guildId);
			},
			edit: async (guildId: string, emojiId: string, body: RESTPatchAPIChannelJSONBody, reason?: string) => {
				const emoji = await this.client.proxy.guilds(guildId).emojis(emojiId).patch({ body, reason });
				await this.client.cache.channels?.setIfNI('GuildEmojisAndStickers', emoji.id!, guildId, emoji);
				return new GuildEmoji(this.client, emoji, guildId);
			},
		}
	}

	get channels() {
		return {
			list: async (guildId: string, force = false) => {
				let channels;
				if (!force) {
					channels = (await this.client.cache.channels?.values(guildId)) ?? [];
					if (channels.length) {
						return channels;
					}
				}
				channels = await this.client.proxy.guilds(guildId).channels.get();
				await this.client.cache.channels?.set(
					channels.map((x) => [x.id, x]),
					guildId,
				);
				return channels.map((m) => channelFrom(m, this.client));
			},
			fetch: async (guildId: string, channelId: string, force?: boolean) => {
				let channel;
				if (!force) {
					channel = await this.client.cache.channels?.get(channelId);
					if (channel) return channel;
				}

				channel = await this.client.proxy.channels(channelId).get();
				await this.client.cache.channels?.patch(channelId, guildId, channel);
				return channelFrom(channel, this.client);
			},
			create: async (guildId: string, body: RESTPostAPIGuildChannelJSONBody) => {
				const res = await this.client.proxy.guilds(guildId).channels.post({ body });
				await this.client.cache.channels?.setIfNI(BaseChannel.__intent__(guildId), res.id, guildId, res);
				return channelFrom(res, this.client);
			},
			delete: async (guildId: string, channelId: string, reason?: string) => {
				const res = await this.client.proxy.channels(channelId).delete({ reason });
				await this.client.cache.channels?.removeIfNI(BaseChannel.__intent__(guildId), res.id, guildId);
				return channelFrom(res, this.client);
			},
			edit: async (guildchannelId: string, channelId: string, body: RESTPatchAPIChannelJSONBody, reason?: string) => {
				const res = await this.client.proxy.channels(channelId).patch({ body, reason });
				await this.client.cache.channels?.setIfNI(BaseChannel.__intent__(guildchannelId), res.id, guildchannelId, res);
				return channelFrom(res, this.client);
			},
			editPositions: (guildId: string, body: RESTPatchAPIGuildChannelPositionsJSONBody) =>
				this.client.proxy.guilds(guildId).channels.patch({ body }),
		};
	}

	get moderation() {
		return {
			list: (guildId: string) => this.client.proxy.guilds(guildId)['auto-moderation'].rules.get(),
			create: (guildId: string, body: RESTPostAPIAutoModerationRuleJSONBody) =>
				this.client.proxy.guilds(guildId)['auto-moderation'].rules.post({ body }),
			delete: (guildId: string, ruleId: string, reason?: string) => {
				return this.client.proxy.guilds(guildId)['auto-moderation'].rules(ruleId).delete({ reason });
			},
			fetch: (guildId: string, ruleId: string) => {
				return this.client.proxy.guilds(guildId)['auto-moderation'].rules(ruleId).get();
			},
			edit: (
				guildId: string,
				ruleId: string,
				body: ObjectToLower<RESTPatchAPIAutoModerationRuleJSONBody>,
				reason?: string,
			) => {
				return this.client.proxy.guilds(guildId)['auto-moderation'].rules(ruleId).patch({ body, reason });
			},
		};
	}

	get stickers() {
		return {
			list: async (guildId: string) => {
				const stickers = await this.client.proxy.guilds(guildId).stickers.get();
				await this.client.cache.stickers?.set(
					stickers.map((st) => [st.id, st]),
					guildId,
				);
				return stickers.map((st) => new Sticker(this.client, st));
			},
			create: async (guildId: string, { file, ...json }: CreateStickerBodyRequest, reason?: string) => {
				const fileResolve = await resolveFiles([file]);
				const sticker = await this.client.proxy
					.guilds(guildId)
					.stickers.post({ reason, body: json, files: [{ ...fileResolve[0], key: 'file' }], appendToFormData: true });
				await this.client.cache.stickers?.setIfNI('GuildEmojisAndStickers', sticker.id, guildId, sticker);
				return new Sticker(this.client, sticker);
			},
			edit: async (guildId: string, stickerId: string, body: RESTPatchAPIGuildStickerJSONBody, reason?: string) => {
				const sticker = await this.client.proxy.guilds(guildId).stickers(stickerId).patch({ body, reason });
				await this.client.cache.stickers?.setIfNI('GuildEmojisAndStickers', stickerId, guildId, sticker);
				return new Sticker(this.client, sticker);
			},
			fetch: async (guildId: string, stickerId: string, force = false) => {
				let sticker;
				if (!force) {
					sticker = await this.client.cache.stickers?.get(stickerId);
					if (sticker) return sticker;
				}
				sticker = await this.client.proxy.guilds(guildId).stickers(stickerId).get();
				await this.client.cache.stickers?.patch(stickerId, guildId, sticker);
				return new Sticker(this.client, sticker);
			},
			delete: async (guildId: string, stickerId: string, reason?: string) => {
				await this.client.proxy.guilds(guildId).stickers(stickerId).delete({ reason });
				await this.client.cache.stickers?.removeIfNI('GuildEmojisAndStickers', stickerId, guildId);
			},
		};
	}
}
