import type { BaseClient } from '../client/base';
import type {
	APIRole,
	MethodContext,
	ObjectToLower,
	RESTPatchAPIGuildRoleJSONBody,
	RESTPatchAPIGuildRolePositionsJSONBody,
	RESTPostAPIGuildRoleJSONBody,
} from '../common';
import { Guild } from './Guild';
import { DiscordBase } from './extra/DiscordBase';

export interface GuildRole extends DiscordBase, ObjectToLower<APIRole> {}

export class GuildRole extends DiscordBase {
	private readonly __methods__!: ReturnType<typeof GuildRole.methods>;
	constructor(client: BaseClient, data: APIRole, readonly guildId: string) {
		super(client, data);

		Object.assign(this, {
			__methods__: GuildRole.methods({ guildId: this.guildId, client }),
		});
	}

	async guild(force?: true): Promise<Guild<'api'>>;
	async guild(force = false) {
		if (!this.guildId) return;
		return this.client.guilds.fetch(this.guildId, force);
	}

	edit(body: RESTPatchAPIGuildRoleJSONBody, reason?: string) {
		return this.__methods__.edit(this.id, body, reason);
	}

	delete(reason?: string) {
		return this.__methods__.delete(this.id, reason);
	}

	static methods(ctx: MethodContext<{ guildId: string }>) {
		return {
			create: (body: RESTPostAPIGuildRoleJSONBody) =>
				ctx.client.proxy
					.guilds(ctx.guildId)
					.roles.post({ body })
					.then((res) => ctx.client.cache.roles?.setIfNI('Guilds', res.id, ctx.guildId, res)),
			list: async (force = false) => {
				let roles: APIRole[] = [];
				if (!force) {
					roles = (await ctx.client.cache.roles?.values(ctx.guildId)) ?? [];
					if (roles.length) {
						return roles.map((r) => new GuildRole(ctx.client, r, ctx.guildId));
					}
				}
				roles = await ctx.client.proxy.guilds(ctx.guildId).roles.get();
				await ctx.client.cache.roles?.set(
					roles.map((r) => [r.id, r]),
					ctx.guildId,
				);
				return roles.map((r) => new GuildRole(ctx.client, r, ctx.guildId));
			},
			edit: (roleId: string, body: RESTPatchAPIGuildRoleJSONBody, reason?: string) => {
				return ctx.client.proxy
					.guilds(ctx.guildId)
					.roles(roleId)
					.patch({ body, reason })
					.then((res) => ctx.client.cache.roles?.setIfNI('Guilds', roleId, ctx.guildId, res));
			},
			delete: (roleId: string, reason?: string) => {
				return ctx.client.proxy
					.guilds(ctx.guildId)
					.roles(roleId)
					.delete({ reason })
					.then(() => ctx.client.cache.roles?.removeIfNI('Guilds', roleId, ctx.guildId));
			},
			editPositions: async (body: RESTPatchAPIGuildRolePositionsJSONBody) => {
				const roles = await ctx.client.proxy.guilds(ctx.guildId).roles.patch({
					body,
				});
				if (!ctx.client.cache.hasRolesIntent) {
					await ctx.client.cache.roles?.set(
						roles.map((x) => [x.id, x]),
						ctx.guildId,
					);
				}
				return roles.map((x) => new GuildRole(ctx.client, x, ctx.guildId));
			},
		};
	}
}
