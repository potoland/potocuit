import type { BaseClient } from '../client/base';
import type { APIEmoji, ObjectToLower, RESTPatchAPIChannelJSONBody } from '../common';
import type { Guild } from './Guild';
import { DiscordBase } from './extra/DiscordBase';

export interface GuildEmoji extends DiscordBase, ObjectToLower<Omit<APIEmoji, 'id'>> {}

export class GuildEmoji extends DiscordBase {
	constructor(
		client: BaseClient,
		data: APIEmoji,
		readonly guildId: string,
	) {
		super(client, { ...data, id: data.id! });
	}

	async guild(force?: true): Promise<Guild<'api'>>;
	async guild(force = false) {
		if (!this.guildId) return;
		return this.client.guilds.fetch(this.guildId, force);
	}

	edit(body: RESTPatchAPIChannelJSONBody, reason?: string) {
		return this.client.guilds.emojis.edit(this.guildId, this.id, body, reason);
	}

	delete(reason?: string) {
		return this.client.guilds.emojis.delete(this.guildId, this.id, reason);
	}

	fetch(force = false) {
		return this.client.guilds.emojis.fetch(this.guildId, this.id, force);
	}

	toString() {
		return `<${this.animated ? 'a' : ''}:${this.name}:${this.id}>`;
	}
}
