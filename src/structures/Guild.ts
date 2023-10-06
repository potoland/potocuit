import { APIGuild, APIGuildMember, APIPartialGuild, ObjectToLower, RESTGetAPIGuildMembersQuery, RESTGetAPIGuildMembersResult, RESTGetAPIGuildMembersSearchQuery, RESTPatchAPIGuildMemberJSONBody, RESTPutAPIGuildMemberJSONBody, FormattingPatterns, RESTPutAPIGuildBanJSONBody } from "@biscuitland/common";
import { BiscuitREST } from "@biscuitland/rest";
import { Cache } from "../cache";
import { BaseGuild } from "./extra/BaseGuild";
import { DiscordBase } from "./extra/DiscordBase";
import { MethodContext } from "../types";
import { GuildMember } from "./GuildMember";
import { GuildMemberResolvable } from "../types/resolvables";
import { GuildTemplate } from "./GuildTemplate";
import { Sticker } from "./Sticker";

export interface Guild extends Omit<ObjectToLower<APIGuild>, 'stickers' | 'emojis' | 'roles'>, DiscordBase {
}

export class Guild extends (BaseGuild as unknown as ToClass<Omit<BaseGuild, keyof ObjectToLower<APIPartialGuild>>, Guild>) {

	constructor(rest: BiscuitREST, cache: Cache, data: APIGuild) {
		super(rest, cache, data);
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

	async fetchOwner(force = false) {
		if (!this.ownerId) throw new Error('No owner in guild');
		return this.members.fetch(this.ownerId, force);
	}

	templates = GuildTemplate.methods(this);
	stickers = Sticker.methods(this);
	members = Guild.members(this);

	static members(ctx: MethodContext) {
		return {
			resolve: async (resolve: GuildMemberResolvable) => {
				if (typeof resolve === "string") {
					const match: { id?: string } | undefined = resolve.match(FormattingPatterns.User)?.groups
					if (match?.id) {
						return await this.members(ctx).fetch(match.id);
					}
					if (resolve.match(/\d{17,20}/)) {
						return await this.members(ctx).fetch(resolve);
					}

					return await this.members(ctx).search({ query: resolve, limit: 1 }).then(x => x[0])
				}

				const { id, displayName } = resolve;

				if (id) {
					return await this.members(ctx).fetch(id);
				}

				return displayName ? await this.members(ctx).search({ query: displayName, limit: 1 }).then(x => x[0]) : undefined;
			},
			search: async (query?: RESTGetAPIGuildMembersSearchQuery) => {
				const members = await ctx.api.guilds(ctx.id).members.search.get({
					query
				});
				await ctx.cache.members?.set(members.map(x => [x.user!.id, x]), ctx.id);
				return members.map(m => new GuildMember(ctx.rest, ctx.cache, m, m.user!, ctx.id));
			},
			unban: async (id: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) => {
				await ctx.api.guilds(ctx.id).bans(id).delete({ reason, body });
			},
			ban: async (id: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) => {
				await ctx.api.guilds(ctx.id).bans(id).put({ reason, body });
				await ctx.cache.members?.removeIfNI('GuildBans', id, ctx.id);
			},
			kick: async (id: string, reason?: string) => {
				await ctx.api.guilds(ctx.id).members(id).delete({ reason });
				await ctx.cache.members?.removeIfNI('GuildMembers', id, ctx.id);
			},
			edit: async (id: string, body: RESTPatchAPIGuildMemberJSONBody, reason?: string) => {
				const member = await ctx.api.guilds(ctx.id).members(id).patch({ body, reason });
				await ctx.cache.members?.setIfNI("GuildMembers", id, ctx.id, member);
				return new GuildMember(ctx.rest, ctx.cache, member, member.user!, ctx.id);
			},
			add: async (userId: string, body: RESTPutAPIGuildMemberJSONBody) => {
				const member = await ctx.api.guilds(ctx.id).members(userId).put({
					body
				});

				// Thanks dapi-types
				if (!member) { return; }

				await ctx.cache.members?.setIfNI('GuildMembers', member.user!.id, ctx.id, member);

				return new GuildMember(ctx.rest, ctx.cache, member, member.user!, ctx.id);
			},
			fetch: async (id: string, force = false): Promise<GuildMember> => {
				let member: APIGuildMember;
				if (!force) {
					member = await ctx.cache.members?.get(ctx.id, id);
					if (member) return new GuildMember(ctx.rest, ctx.cache, member, member.user!, ctx.id);
				}

				member = await ctx.api.guilds(ctx.id).members(id).get();
				await ctx.cache.members?.set(member.user!.id, ctx.id, member);
				return new GuildMember(ctx.rest, ctx.cache, member, member.user!, ctx.id);
			},

			list: async (query?: RESTGetAPIGuildMembersQuery, force = false): Promise<GuildMember[]> => {
				let members: RESTGetAPIGuildMembersResult;
				if (!force) {
					members = await ctx.cache.members?.values(ctx.id) ?? [];
					if (members.length) return members.map(m => new GuildMember(ctx.rest, ctx.cache, m, m.user!, ctx.id));
				}
				members = await ctx.api.guilds(ctx.id).members.get({
					query
				});
				await ctx.cache.members?.set(members.map(x => [x.user!.id, x]), ctx.id);
				return members.map(m => new GuildMember(ctx.rest, ctx.cache, m, m.user!, ctx.id));
			},
		}
	}
}

/** Maximun custom guild emojis per level */
export type MaxEmojis = 50 | 100 | 150 | 250;

/** Maximun custom guild stickers per level */
export type MaxStickers = 5 | 15 | 30 | 60;
