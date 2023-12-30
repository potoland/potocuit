import type {
	RESTGetAPIGuildMembersQuery,
	RESTGetAPIGuildMembersSearchQuery,
	RESTPutAPIGuildMemberJSONBody,
} from '../common';
import {
	FormattingPatterns,
	type APIGuildMember,
	type APIInteractionDataResolvedGuildMember,
	type APIUser,
	type GatewayGuildMemberAddDispatchData,
	type GatewayGuildMemberUpdateDispatchData,
	type ObjectToLower,
	type RESTPatchAPIGuildMemberJSONBody,
	type RESTPutAPIGuildBanJSONBody,
} from '../common';
import { DiscordBase } from './extra/DiscordBase';

export type GuildMemberData =
	| APIGuildMember
	| GatewayGuildMemberUpdateDispatchData
	| GatewayGuildMemberAddDispatchData
	| APIInteractionDataResolvedGuildMember;

import type { BaseClient } from '../client/base';
import type { ImageOptions, MethodContext } from '../common/types/options';
import type { GuildMemberResolvable } from '../common/types/resolvables';
import { Guild } from './Guild';
import { User } from './User';

export interface GuildMember extends DiscordBase, Omit<ObjectToLower<APIGuildMember>, 'user' | 'roles'> { }
/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class GuildMember extends DiscordBase {
	user: User;
	private _roles: string[];
	joinedTimestamp?: number;
	communicationDisabledUntilTimestamp?: number | null;
	private readonly __methods__!: ReturnType<typeof GuildMember.methods>;

	constructor(
		client: BaseClient,
		data: GuildMemberData,
		user: APIUser | User,
		/** the choosen guild id */
		readonly guildId: string,
	) {
		super(client, { ...data, id: user.id });
		this.user = user instanceof User ? user : new User(client, user);
		this._roles = data.roles;
		Object.assign(this, {
			__methods__: GuildMember.methods({ id: this.guildId, client, api: this.api }),
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

	async guild(force = false) {
		if (!force) {
			const guild = await this.cache.guilds?.get(this.guildId);
			if (guild) return guild;
		}

		return new Guild(this.client, await this.api.guilds(this.guildId).get());
	}

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

	dynamicAvatarURL(options?: ImageOptions): string {
		if (!this.avatar) {
			return this.user.avatarURL(options);
		}

		return this.rest.cdn.guildMemberAvatar(this.guildId, this.id, this.avatar, options);
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

	get roles() {
		return {
			values: Object.freeze(this._roles),
			add: async (id: string) => {
				await this.api.guilds(this.guildId).members(this.id).roles(id).put({});
			},
			remove: async (id: string) => {
				await this.api.guilds(this.guildId).members(this.id).roles(id).delete();
			},
		};
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

					return await this.methods(ctx)
						.search({ query: resolve, limit: 1 })
						.then((x) => x[0]);
				}

				const { id, displayName } = resolve;

				if (id) {
					return await this.methods(ctx).fetch(id);
				}

				return displayName
					? await this.methods(ctx)
						.search({ query: displayName, limit: 1 })
						.then((x) => x[0])
					: undefined;
			},
			search: async (query?: RESTGetAPIGuildMembersSearchQuery) => {
				const members = await ctx.api.guilds(ctx.id).members.search.get({
					query,
				});
				await ctx.client.cache.members?.set(
					members.map((x) => [x.user!.id, x]),
					ctx.id,
				);
				return members.map((m) => new GuildMember(ctx.client, m, m.user!, ctx.id));
			},
			unban: async (id: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) => {
				await ctx.api.guilds(ctx.id).bans(id).delete({ reason, body });
			},
			ban: async (id: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) => {
				await ctx.api.guilds(ctx.id).bans(id).put({ reason, body });
				await ctx.client.cache.members?.removeIfNI('GuildBans', id, ctx.id);
			},
			kick: async (id: string, reason?: string) => {
				await ctx.api.guilds(ctx.id).members(id).delete({ reason });
				await ctx.client.cache.members?.removeIfNI('GuildMembers', id, ctx.id);
			},
			edit: async (id: string, body: RESTPatchAPIGuildMemberJSONBody, reason?: string) => {
				const member = await ctx.api.guilds(ctx.id).members(id).patch({ body, reason });
				await ctx.client.cache.members?.setIfNI('GuildMembers', id, ctx.id, member);
				return new GuildMember(ctx.client, member, member.user!, ctx.id);
			},
			add: async (id: string, body: RESTPutAPIGuildMemberJSONBody) => {
				const member = await ctx.api.guilds(ctx.id).members(id).put({
					body,
				});

				// Thanks dapi-types, fixed
				if (!member) {
					return;
				}

				await ctx.client.cache.members?.setIfNI('GuildMembers', member.user!.id, ctx.id, member);

				return new GuildMember(ctx.client, member, member.user!, ctx.id);
			},
			fetch: async (id: string, force = false) => {
				let member;
				if (!force) {
					member = await ctx.client.cache.members?.get(ctx.id, id);
					if (member) return member;
				}

				member = await ctx.api.guilds(ctx.id).members(id).get();
				await ctx.client.cache.members?.set(member.user!.id, ctx.id, member);
				return new GuildMember(ctx.client, member, member.user!, ctx.id);
			},

			list: async (query?: RESTGetAPIGuildMembersQuery, force = false) => {
				let members;
				if (!force) {
					members = (await ctx.client.cache.members?.values(ctx.id)) ?? [];
					if (members.length) return members;
				}
				members = await ctx.api.guilds(ctx.id).members.get({
					query,
				});
				await ctx.client.cache.members?.set(
					members.map((x) => [x.user!.id, x]),
					ctx.id,
				);
				return members.map((m) => new GuildMember(ctx.client, m, m.user!, ctx.id));
			},
		};
	}
}

export interface InteractionGuildMember
	extends GuildMember,
	ObjectToLower<Omit<APIInteractionDataResolvedGuildMember, 'roles'>> { }
/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class InteractionGuildMember extends GuildMember {
	declare mute: never;
	declare deaf: never;
	constructor(
		client: BaseClient,
		data: APIInteractionDataResolvedGuildMember,
		user: APIUser | User,
		/** the choosen guild id */
		guildId: string,
	) {
		super(client, data, user, guildId);
	}
}
