import type {
	RESTGetAPIGuildMembersQuery,
	RESTGetAPIGuildMembersSearchQuery,
	RESTPutAPIGuildMemberJSONBody,
} from '../common';
import {
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

export interface GuildMember extends DiscordBase, Omit<ObjectToLower<APIGuildMember>, 'user' | 'roles'> {}
/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class GuildMember extends DiscordBase {
	user: User;
	private _roles: string[];
	joinedTimestamp?: number;
	communicationDisabledUntilTimestamp?: number | null;
	constructor(
		client: BaseClient,
		data: GuildMemberData,
		user: APIUser | User,
		/** the choosen guild id */
		readonly guildId: string,
	) {
		const { roles, ...dataN } = data;
		super(client, { ...dataN, id: user.id });
		this.user = user instanceof User ? user : new User(client, user);
		this._roles = data.roles;
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

	async guild(force?: true): Promise<Guild<'api'>>;
	async guild(force = false) {
		return this.client.guilds.fetch(this.id, force);
	}

	fetch(force = false) {
		return this.client.members.fetch(this.guildId, this.id, force);
	}

	ban(body?: RESTPutAPIGuildBanJSONBody, reason?: string) {
		return this.client.members.ban(this.guildId, this.id, body, reason);
	}

	kick(reason?: string) {
		return this.client.members.kick(this.guildId, this.id, reason);
	}

	edit(body: RESTPatchAPIGuildMemberJSONBody, reason?: string) {
		return this.client.members.edit(this.guildId, this.id, body, reason);
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
		const methods = this.client.members.roles;
		return {
			values: Object.freeze(this._roles),
			add: async (id: string) => methods.add(this.guildId, this.id, id),
			remove: async (id: string) => methods.remove(this.guildId, this.id, id),
		};
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		const methods = client.members;
		return {
			resolve: async (resolve: GuildMemberResolvable) => methods.resolve(guildId, resolve),
			search: async (query?: RESTGetAPIGuildMembersSearchQuery) => methods.search(guildId, query),
			unban: async (id: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) =>
				methods.unban(guildId, id, body, reason),
			ban: async (id: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) =>
				methods.ban(guildId, id, body, reason),
			kick: async (id: string, reason?: string) => methods.kick(guildId, id, reason),
			edit: async (id: string, body: RESTPatchAPIGuildMemberJSONBody, reason?: string) =>
				methods.edit(guildId, id, body, reason),
			add: async (id: string, body: RESTPutAPIGuildMemberJSONBody) => methods.add(guildId, id, body),
			fetch: async (memberId: string, force = false) => methods.fetch(guildId, memberId, force),
			list: async (query?: RESTGetAPIGuildMembersQuery, force = false) => methods.list(guildId, query, force),
		};
	}
}

export interface InteractionGuildMember
	extends GuildMember,
		ObjectToLower<Omit<APIInteractionDataResolvedGuildMember, 'roles'>> {}
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
