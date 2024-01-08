import type { Attachment } from '../builders';
import type { BaseClient } from '../client/base';
import type {
	APISticker,
	MethodContext,
	ObjectToLower,
	RESTPatchAPIGuildStickerJSONBody,
	RESTPostAPIGuildStickerFormDataBody,
} from '../common';
import type { Guild } from './Guild';
import { User } from './User';
import { DiscordBase } from './extra/DiscordBase';

export interface Sticker extends DiscordBase, ObjectToLower<Omit<APISticker, 'user'>> {}

export class Sticker extends DiscordBase {
	user?: User;
	constructor(client: BaseClient, data: APISticker) {
		super(client, data);
		if (data.user) {
			this.user = new User(this.client, data.user);
		}
	}

	async guild(force?: true): Promise<Guild<'api'> | undefined>;
	async guild(force = false) {
		if (!this.guildId) return;
		return this.client.guilds.fetch(this.id, force);
	}

	edit(body: RESTPatchAPIGuildStickerJSONBody, reason?: string) {
		if (!this.guildId) return;
		return this.client.guilds.stickers.edit(this.guildId, this.id, body, reason);
	}

	fetch(force = false) {
		if (!this.guildId) return;
		return this.client.guilds.stickers.fetch(this.guildId, this.id, force);
	}

	delete(reason?: string) {
		if (!this.guildId) return;
		return this.client.guilds.stickers.delete(this.guildId, this.id, reason);
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		const methods = client.guilds.stickers;
		return {
			list: async () => methods.list(guildId),
			create: async (payload: CreateStickerBodyRequest, reason?: string) => methods.create(guildId, payload, reason),
			edit: async (stickerId: string, body: RESTPatchAPIGuildStickerJSONBody, reason?: string) =>
				methods.edit(guildId, stickerId, body, reason),
			fetch: async (stickerId: string, force = false) => methods.fetch(guildId, stickerId, force),
			delete: async (stickerId: string, reason?: string) => methods.delete(guildId, stickerId, reason),
		};
	}
}

export interface CreateStickerBodyRequest extends Omit<RESTPostAPIGuildStickerFormDataBody, 'file'> {
	file: Attachment;
}
