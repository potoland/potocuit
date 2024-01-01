import type { BaseClient } from '../client/base';
import type { APIEmoji, ObjectToLower } from '../common';
import { Guild } from './Guild';
import { DiscordBase } from './extra/DiscordBase';

export interface GuildEmoji extends DiscordBase, ObjectToLower<Omit<APIEmoji, 'id'>> {}

export class GuildEmoji extends DiscordBase {
	constructor(client: BaseClient, data: APIEmoji, readonly guildId: string) {
		super(client, { ...data, id: data.id! });
	}

	async guild(force: true): Promise<Guild<'api'>>;
	async guild(force = false) {
		if (!this.guildId) return;
		return this.client.guilds.fetch(this.guildId, force);
	}

	toString() {
		return `<${this.animated ? 'a' : ''}:${this.name}:${this.id}>`;
	}
}
