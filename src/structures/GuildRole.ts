import type { APIRole, ObjectToLower, RESTPatchAPIGuildRoleJSONBody, RESTPatchAPIGuildRolePositionsJSONBody, RESTPostAPIGuildRoleJSONBody } from '@biscuitland/common';
import { DiscordBase } from './extra/DiscordBase';
import type { Cache } from '../cache';
import type { BiscuitREST } from '@biscuitland/rest';
import type { MethodContext } from '../types';

export interface GuildRole extends DiscordBase, ObjectToLower<APIRole> { }

export class GuildRole extends DiscordBase {
	private readonly __methods__!: ReturnType<typeof GuildRole.methods>;
	constructor(rest: BiscuitREST, cache: Cache, data: APIRole, readonly guildId: string) {
		super(rest, cache, data);

		Object.assign(this, {
			__methods__: GuildRole.methods({ id: this.guildId, rest: this.rest, api: this.api, cache: this.cache, roleId: this.id }),
		});
	}

	edit(body: RESTPatchAPIGuildRoleJSONBody, reason?: string) {
		return this.__methods__.edit(body, reason);
	}

	delete(reason?: string) {
		return this.__methods__.delete(reason);
	}

	static methods(ctx: MethodContext<{ roleId?: string }>) {
		return {
			create: (body: RESTPostAPIGuildRoleJSONBody) =>
				ctx.api.guilds(ctx.id).roles.post({ body })
					.then(res => ctx.cache.roles?.setIfNI('Guilds', res.id, ctx.id, res)),
			list: async (force = false) => {
				let roles: APIRole[] = [];
				if (!force) {
					roles = await ctx.cache.roles?.values(ctx.id) ?? [];
					if (roles.length) { return roles.map(r => new GuildRole(ctx.rest, ctx.cache, r, ctx.id)); }
				}
				roles = await ctx.api.guilds(ctx.id).roles.get();
				await ctx.cache.roles?.set(roles.map(r => [r.id, r]), ctx.id);
				return roles.map(r => new GuildRole(ctx.rest, ctx.cache, r, ctx.id));
			},
			edit: (body: RESTPatchAPIGuildRoleJSONBody, reason?: string) => {
				if (!ctx.roleId) { throw new Error('No roleId'); }
				return ctx.api.guilds(ctx.id).roles(ctx.roleId).patch({ body, reason })
					.then(res =>
						ctx.cache.roles?.setIfNI('Guilds', ctx.roleId!, ctx.id, res)
					);
			},
			delete: (reason?: string) => {
				if (!ctx.roleId) { throw new Error('No ctx.roleId'); }
				return ctx.api.guilds(ctx.id).roles(ctx.roleId).delete({ reason })
					.then(() =>
						ctx.cache.roles?.removeIfNI('Guilds', ctx.roleId!, ctx.id)
					);
			},
			editPositions: async (body: RESTPatchAPIGuildRolePositionsJSONBody) => {
				const roles = await ctx.api.guilds(ctx.id).roles.patch({
					body
				});
				if (!ctx.cache.hasRolesIntent) {
					await ctx.cache.roles?.set(roles.map(x => [x.id, x]), ctx.id);
				}
				return roles.map(x => new GuildRole(ctx.rest, ctx.cache, x, ctx.id));
			}
		};
	}
}
