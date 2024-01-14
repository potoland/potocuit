import type {
	APIGuildMember,
	APIInteractionDataResolvedGuildMember,
	APIUser,
	GatewayGuildMemberAddDispatchData,
	GatewayGuildMemberUpdateDispatchData,
	MakeRequired,
	ObjectToLower,
	RESTGetAPIGuildMembersQuery,
	RESTGetAPIGuildMembersSearchQuery,
	RESTPatchAPIGuildMemberJSONBody,
	RESTPutAPIGuildBanJSONBody,
	RESTPutAPIGuildMemberJSONBody,
	ToClass,
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
import type { Guild } from './Guild';
import { User } from './User';

export type GatewayGuildMemberAddDispatchDataFixed<Pending extends boolean> = Pending extends true
	? Omit<GatewayGuildMemberAddDispatchData, 'user'> & { id: string }
	: MakeRequired<GatewayGuildMemberAddDispatchData, 'user'>;

export interface BaseGuildMember extends DiscordBase, Omit<ObjectToLower<APIGuildMember>, 'user' | 'roles'> { }
export class BaseGuildMember extends DiscordBase {
	private _roles: string[];
	joinedTimestamp?: number;
	communicationDisabledUntilTimestamp?: number | null;
	constructor(
		client: BaseClient,
		data: GuildMemberData,
		id: string,
		/** the choosen guild id */
		readonly guildId: string,
	) {
		const { roles, ...dataN } = data;
		super(client, { ...dataN, id });
		this._roles = data.roles;
		this.patch(data);
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

	toString() {
		return `<@${this.id}>`;
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
			add: async (id: string) => this.client.members.roles.add(this.guildId, this.id, id),
			remove: async (id: string) => this.client.members.roles.remove(this.guildId, this.id, id),
		};
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		return {
			resolve: async (resolve: GuildMemberResolvable) => client.members.resolve(guildId, resolve),
			search: async (query?: RESTGetAPIGuildMembersSearchQuery) => client.members.search(guildId, query),
			unban: async (id: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) =>
				client.members.unban(guildId, id, body, reason),
			ban: async (id: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) =>
				client.members.ban(guildId, id, body, reason),
			kick: async (id: string, reason?: string) => client.members.kick(guildId, id, reason),
			edit: async (id: string, body: RESTPatchAPIGuildMemberJSONBody, reason?: string) =>
				client.members.edit(guildId, id, body, reason),
			add: async (id: string, body: RESTPutAPIGuildMemberJSONBody) => client.members.add(guildId, id, body),
			fetch: async (memberId: string, force = false) => client.members.fetch(guildId, memberId, force),
			list: async (query?: RESTGetAPIGuildMembersQuery, force = false) => client.members.list(guildId, query, force),
		};
	}
}

export interface GuildMember extends Omit<ObjectToLower<APIGuildMember>, 'user' | 'roles'> { }
/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class GuildMember extends BaseGuildMember {
	user: User;
	constructor(
		client: BaseClient,
		data: GuildMemberData,
		user: APIUser | User,
		/** the choosen guild id */
		readonly guildId: string,
	) {
		super(client, data, user.id, guildId);
		this.user = user instanceof User ? user : new User(client, user);
	}

	get username() {
		return this.user.username;
	}

	get globalName() {
		return this.user.globalName;
	}

	/** gets the nickname or the username */
	get displayName() {
		return this.nick ?? this.globalName ?? this.username;
	}

	dynamicAvatarURL(options?: ImageOptions) {
		if (!this.avatar) {
			return this.user.avatarURL(options);
		}

		return this.rest.cdn.guildMemberAvatar(this.guildId, this.id, this.avatar, options);
	}
}

export interface UnavailableMember {
	pending: true
}

export class UnavailableMember extends BaseGuildMember {

}

export interface InteractionGuildMember
	extends ObjectToLower<Omit<APIInteractionDataResolvedGuildMember, 'roles' | 'deaf' | 'mute'>> { }
/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class InteractionGuildMember extends (GuildMember as unknown as ToClass<Omit<GuildMember, 'deaf' | 'mute'>, InteractionGuildMember>) {
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
