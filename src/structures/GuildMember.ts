import type {
	RESTGetAPIGuildMembersQuery,
	RESTGetAPIGuildMembersResult,
	RESTGetAPIGuildMembersSearchQuery,
	RESTPutAPIGuildMemberJSONBody
} from '@biscuitland/common';
import {
	type APIGuildMember,
	type APIInteractionDataResolvedGuildMember,
	type APIUser,
	type GatewayGuildMemberAddDispatchData,
	type GatewayGuildMemberUpdateDispatchData,
	type RESTPatchAPIGuildMemberJSONBody,
	type RESTPutAPIGuildBanJSONBody,
	type ObjectToLower,
	FormattingPatterns
} from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { DiscordBase } from './extra/DiscordBase';

export type GuildMemberData = APIGuildMember | GatewayGuildMemberUpdateDispatchData | GatewayGuildMemberAddDispatchData | APIInteractionDataResolvedGuildMember;

import { User } from './User';
import type { Cache } from '../cache';
import type { ImageOptions, MethodContext } from '../types/options';
import type { GuildMemberResolvable } from '../types/resolvables';

export interface GuildMember extends DiscordBase, Omit<ObjectToLower<APIGuildMember>, 'user'> { }
/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class GuildMember extends DiscordBase {
	user: User;
	joinedTimestamp?: number;
	communicationDisabledUntilTimestamp?: number | null;
	private readonly __methods__!: ReturnType<typeof GuildMember.methods>;

	constructor(
		rest: BiscuitREST,
		cache: Cache,
		data: GuildMemberData,
		user: APIUser | User,
		/** the choosen guild id */
		readonly guildId: string
	) {
		super(rest, cache, { ...data, id: user.id });
		this.user = user instanceof User ? user : new User(rest, cache, user);
		Object.defineProperty(this, '__methods__', {
			value: GuildMember.methods({ id: this.guildId, rest: this.rest, api: this.api, cache: this.cache }),
			writable: false,
		});
		this.patch(data);
	}

	get username() {
		return this.user.username;
	}

	get globalName() {
		return this.user.globalName;
	}

	/** gets the nickname or the username */
	get displayName(): string {
		return this.nick ?? this.globalName ?? this.username;
	}

	/**
	 * Fetch member on API
	 */
	fetch(force = false) {
		return this.__methods__.fetch(this.id, force);
	}

	ban(body?: RESTPutAPIGuildBanJSONBody, reason?: string) {
		return this.__methods__.ban(this.id, body, reason);
	}

	kick(reason?: string) {
		return this.__methods__.kick(this.id, reason);
	}

	edit(body: RESTPatchAPIGuildMemberJSONBody, reason?: string) {
		return this.__methods__.edit(this.id, body, reason).then(this._patchThis);
	}

	dynamicAvatarURL(options?: ImageOptions): string | null {
		if (!this.avatar) {
			return this.user.avatarURL(options);
		}

		return this.rest.api.cdn.guildMemberAvatar(this.guildId, this.id, this.avatar, options);
	}

	toString(): string {
		return `<@${this.user.id}>`;
	}

	private patch(data: GuildMemberData) {
		if ('joined_at' in data && data.joined_at) {
			this.joinedTimestamp = Date.parse(data.joined_at);
		}
		if ('communication_disabled_until' in data) {
			this.communicationDisabledUntilTimestamp = data.communication_disabled_until?.length
				? Date.parse(data.communication_disabled_until)
				: null;
		}
	}

	static methods(ctx: MethodContext) {
		return {
			resolve: async (resolve: GuildMemberResolvable) => {
				if (typeof resolve === 'string') {
					const match: { id?: string } | undefined = resolve.match(FormattingPatterns.User)?.groups;
					if (match?.id) {
						return await this.methods(ctx).fetch(match.id);
					}
					if (resolve.match(/\d{17,20}/)) {
						return await this.methods(ctx).fetch(resolve);
					}

					return await this.methods(ctx).search({ query: resolve, limit: 1 }).then(x => x[0]);
				}

				const { id, displayName } = resolve;

				if (id) {
					return await this.methods(ctx).fetch(id);
				}

				return displayName ? await this.methods(ctx).search({ query: displayName, limit: 1 }).then(x => x[0]) : undefined;
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
				await ctx.cache.members?.setIfNI('GuildMembers', id, ctx.id, member);
				return new GuildMember(ctx.rest, ctx.cache, member, member.user!, ctx.id);
			},
			add: async (id: string, body: RESTPutAPIGuildMemberJSONBody) => {
				const member = await ctx.api.guilds(ctx.id).members(id).put({
					body
				});

				// Thanks dapi-types, fixed
				if (!member) { return; }

				await ctx.cache.members?.setIfNI('GuildMembers', member.user!.id, ctx.id, member);

				return new GuildMember(ctx.rest, ctx.cache, member, member.user!, ctx.id);
			},
			fetch: async (id: string, force = false) => {
				let member: APIGuildMember;
				if (!force) {
					member = await ctx.cache.members?.get(ctx.id, id);
					if (member) { return new GuildMember(ctx.rest, ctx.cache, member, member.user!, ctx.id); }
				}

				member = await ctx.api.guilds(ctx.id).members(id).get();
				await ctx.cache.members?.set(member.user!.id, ctx.id, member);
				return new GuildMember(ctx.rest, ctx.cache, member, member.user!, ctx.id);
			},

			list: async (query?: RESTGetAPIGuildMembersQuery, force = false) => {
				let members: RESTGetAPIGuildMembersResult;
				if (!force) {
					members = await ctx.cache.members?.values(ctx.id) ?? [];
					if (members.length) { return members.map(m => new GuildMember(ctx.rest, ctx.cache, m, m.user!, ctx.id)); }
				}
				members = await ctx.api.guilds(ctx.id).members.get({
					query
				});
				await ctx.cache.members?.set(members.map(x => [x.user!.id, x]), ctx.id);
				return members.map(m => new GuildMember(ctx.rest, ctx.cache, m, m.user!, ctx.id));
			},
		};
	}
}

export interface InteractionGuildMember extends GuildMember, ObjectToLower<APIInteractionDataResolvedGuildMember> { }
/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class InteractionGuildMember extends GuildMember {
	declare mute: never;
	declare deaf: never;
	constructor(
		rest: BiscuitREST,
		cache: Cache,
		data: APIInteractionDataResolvedGuildMember,
		user: APIUser | User,
		/** the choosen guild id */
		guildId: string
	) {
		super(rest, cache, data, user, guildId);
	}
}
