import { APIRole, ObjectToLower } from "@biscuitland/common";
import { DiscordBase } from "./extra/DiscordBase";
import type { Cache } from '../cache';
import { BiscuitREST } from "@biscuitland/rest";
import { MethodContext } from "../types";

export interface GuildRole extends DiscordBase, ObjectToLower<APIRole> { }

export class GuildRole extends DiscordBase {
	constructor(rest: BiscuitREST, cache: Cache, data: APIRole, readonly guildId: string) {
		super(rest, cache, data);
		// this._patchThis()
	}


	static methods(ctx: MethodContext<{ roleId?: string }>) {
		return {
			list: async (force = false) => {
				let roles: APIRole[] = [];
				if (!force) {
					roles = await ctx.cache.roles?.values(ctx.id) ?? [];
					if (roles.length) return roles.map(r => new GuildRole(ctx.rest, ctx.cache, r, ctx.id));
				}

				roles = await ctx.api.guilds(ctx.id).roles.get();
				await ctx.cache.roles?.set(roles.map(r => [r.id, r]), ctx.id);
				return roles.map(r => new GuildRole(ctx.rest, ctx.cache, r, ctx.id))
			},
			edit: async () => {

			}
		}
	}
}
