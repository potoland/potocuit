import type { BaseClient } from '../client/base';
import type {
	APIRole,
	MethodContext,
	ObjectToLower,
	RESTPatchAPIGuildRoleJSONBody,
	RESTPatchAPIGuildRolePositionsJSONBody,
	RESTPostAPIGuildRoleJSONBody,
} from '../common';
import { DiscordBase } from './extra/DiscordBase';

export interface GuildRole extends DiscordBase, ObjectToLower<APIRole> { }

export class GuildRole extends DiscordBase {
	constructor(
		client: BaseClient,
		data: APIRole,
		readonly guildId: string,
	) {
		super(client, data);
	}

	async guild(force = false) {
		if (!this.guildId) return;
		return this.client.guilds.fetch(this.guildId, force);
	}

	edit(body: RESTPatchAPIGuildRoleJSONBody, reason?: string) {
		return this.client.roles.create(this.guildId, body, reason);
	}

	delete(reason?: string) {
		return this.client.roles.delete(this.guildId, this.id, reason);
	}

	static methods(ctx: MethodContext<{ guildId: string }>) {
		return {
			create: (body: RESTPostAPIGuildRoleJSONBody) => ctx.client.roles.create(ctx.guildId, body),
			list: (force = false) => ctx.client.roles.list(ctx.guildId, force),
			edit: (roleId: string, body: RESTPatchAPIGuildRoleJSONBody, reason?: string) =>
				ctx.client.roles.edit(ctx.guildId, roleId, body, reason),
			delete: (roleId: string, reason?: string) => ctx.client.roles.delete(ctx.guildId, roleId, reason),
			editPositions: (body: RESTPatchAPIGuildRolePositionsJSONBody) =>
				ctx.client.roles.editPositions(ctx.guildId, body),
		};
	}
}
