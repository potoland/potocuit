import type {
	APIGuild, APIPartialGuild, GatewayGuildCreateDispatchData, ObjectToLower, RESTGetAPIAuditLogQuery, RESTPatchAPIGuildEmojiJSONBody, RESTPatchAPIGuildRoleJSONBody, RESTPatchAPIGuildRolePositionsJSONBody, RESTPatchAPIGuildStickerJSONBody, RESTPatchAPIGuildTemplateJSONBody, RESTPatchAPIGuildWelcomeScreenJSONBody, RESTPatchAPIGuildWidgetSettingsJSONBody, RESTPostAPIGuildEmojiJSONBody, RESTPostAPIGuildRoleJSONBody, RESTPostAPIGuildStickerFormDataBody, RESTPostAPIGuildTemplatesJSONBody, RESTPostAPIGuildsMFAJSONBody
} from '@biscuitland/common';

import type { BiscuitREST } from '@biscuitland/rest';
import { GuildMember } from './GuildMember';
import { BaseGuild } from './extra/BaseGuild';
import type { DiscordBase } from './extra/DiscordBase';
import type { Cache } from './cache';

type ToClass<T, This> = new (...args: any[]) => {
	[K in keyof T]: T[K] extends (...args: any[]) => any
	? ReturnType<T[K]> extends Promise<T>
	? (...args: Parameters<T[K]>) => Promise<This>
	: ReturnType<T[K]> extends T
	? (...args: Parameters<T[K]>) => This
	: T[K]
	: T[K]
};

export interface Guild extends ObjectToLower<APIGuild>, DiscordBase { }

export class Guild extends (BaseGuild as unknown as ToClass<Omit<BaseGuild, keyof ObjectToLower<APIPartialGuild>>, Guild>) {
	members?: GuildMember[];
	constructor(rest: BiscuitREST, cache: Cache, data: APIGuild | GatewayGuildCreateDispatchData) {
		// eslint-disable-next-line constructor-super
		super(rest, cache, data);
		this.gatewayPatch(data);
	}

	get maxStickers(): MaxStickers {
		switch (this.premiumTier) {
			case 1:
				return 15;
			case 2:
				return 30;
			case 3:
				return 60;
			default:
				return 5;
		}
	}

	/** Returns the maximum number of emoji slots */
	get maxEmojis(): MaxEmojis {
		switch (this.premiumTier) {
			case 1:
				return 100;
			case 2:
				return 150;
			case 3:
				return 250;
			default:
				return 50;
		}
	}

	templates() {
		return {
			fetch: () => {
				return this.api.guilds(this.id).templates.get();
			},
			create: (body: RESTPostAPIGuildTemplatesJSONBody) => {
				return this.api.guilds(this.id).templates.post({ body });
			},
			sync: (code: string) => {
				return this.api.guilds(this.id).templates(code).put({});
			},
			edit: (code: string, body: RESTPatchAPIGuildTemplateJSONBody) => {
				return this.api.guilds(this.id).templates(code).patch({ body });
			},
			delete: (code: string) => {
				return this.api.guilds(this.id).templates(code).delete();
			},
		};
	}

	fetchEmojis() {
		return this.api.guilds(this.id).emojis.get();
	}

	createEmoji(body: RESTPostAPIGuildEmojiJSONBody) {
		return this.api.guilds(this.id).emojis.post({ body });
	}

	editEmoji(id: string, body: RESTPatchAPIGuildEmojiJSONBody) {
		return this.api.guilds(this.id).emojis(id).patch({ body });
	}

	fetchEmoji(id: string) {
		return this.api.guilds(this.id).emojis(id).get();
	}

	deleteEmoji(id: string) {
		return this.api.guilds(this.id).emojis(id).delete();
	}

	/**
	 * Get guild stickers
	 */
	fetchStickers() {
		return this.api.guilds(this.id).stickers.get();
	}

	createSticker(body: RESTPostAPIGuildStickerFormDataBody) {
		return this.api.guilds(this.id).stickers.post({ body });
	}

	editSticker(id: string, body: RESTPatchAPIGuildStickerJSONBody) {
		return this.api.guilds(this.id).stickers(id).patch({ body });
	}

	fetchSticker(id: string) {
		return this.api.guilds(this.id).stickers(id).get();
	}

	deleteSticker(id: string) {
		return this.api.guilds(this.id).stickers(id).delete();
	}

	/**
	 * Creates a role
	 * @param body Body of the request
	 */
	createRole(body: RESTPostAPIGuildRoleJSONBody) {
		return this.api.guilds(this.id).roles.post({
			body
		});
	}

	editRolePositions(body: RESTPatchAPIGuildRolePositionsJSONBody) {
		return this.api.guilds(this.id).roles.patch({
			body
		});
	}

	fetchRoles() {
		return this.api.guilds(this.id).roles.get();
	}

	fetchOwner() {
		return this.api.guilds(this.id).members(this.ownerId).get()
			.then(x => new GuildMember(this.rest, this.cache, x, x.user!, this.id));
	}

	fetchIntegrations() {
		return this.api.guilds(this.id)
			.integrations
			.get();
	}

	fetchWelcomeScreen() {
		return this.api.guilds(this.id)['welcome-screen'].get();
	}

	fetchPreview() {
		return this.api.guilds(this.id)
			.preview.get();
	}

	async fetchVanityData() {
		const data = await this.api.guilds(this.id)['vanity-url'].get();
		this.vanityUrlCode = data.code;
		return data;
	}

	fetchWidget() {
		return this.api.guilds(this.id)['widget.json'].get();
	}

	async fetchWidgetSettings() {
		const data = await this.api.guilds(this.id).widget.get();
		this.widgetEnabled = data.enabled;
		this.widgetChannelId = data.channel_id;
		return data;
	}

	fetchAuditLogs(query: RESTGetAPIAuditLogQuery) {
		return this.api.guilds(this.id)['audit-logs'].get({ query });
	}

	editWelcomeScreen(body: RESTPatchAPIGuildWelcomeScreenJSONBody) {
		return this.api.guilds(this.id)['welcome-screen'].patch({ body });
	}

	setWidgetSettings(body: RESTPatchAPIGuildWidgetSettingsJSONBody) {
		return this.api.guilds(this.id).widget.patch({ body });
	}

	setMFALevel(body: RESTPostAPIGuildsMFAJSONBody) {
		return this.api.guilds(this.id).mfa.post({ body });
	}

	delete() {
		return this.api.guilds(this.id).delete();
	}

	leave() {
		return this.api.users('@me').guilds(this.id).delete();
	}

	/**
	 * Deletes a role
	 * @param roleId ID of the role to delete
	 */
	deleteRole(roleId: string) {
		return this.api.guilds(this.id).roles(roleId).delete();
	}

	/**
	 * Deletes a role
	 * @param roleId ID of the role to delete
	 */
	editRole(roleId: string, body: RESTPatchAPIGuildRoleJSONBody) {
		return this.api.guilds(this.id).roles(roleId).patch({
			body
		});
	}

	/**
	 * Assigns a role to a member
	 * @param memberId ID of the member
	 * @param roleId ID of the role
	 */
	assignRole(memberId: string, roleId: string) {
		return this.api.guilds(this.id).members(memberId).roles(roleId).put({});
	}

	removeRole(memberId: string, roleId: string) {
		return this.api.guilds(this.id).members(memberId).roles(roleId).delete();
	}


	private gatewayPatch(data: APIGuild | GatewayGuildCreateDispatchData) {
		if ('members' in data && data.members.length) {
			this.members = data.members.map(m => new GuildMember(this.rest, this.cache, m, m.user!, this.id));
		}
	}
}

/** Maximun custom guild emojis per level */
export type MaxEmojis = 50 | 100 | 150 | 250;

/** Maximun custom guild stickers per level */
export type MaxStickers = 5 | 15 | 30 | 60;
