import type {
	APIGuildMember,
	APIInteractionDataResolvedGuildMember,
	APIUser,
	GatewayGuildMemberAddDispatchData,
	GatewayGuildMemberUpdateDispatchData,
	RESTPatchAPIGuildMemberJSONBody,
	RESTPutAPIGuildBanJSONBody,
	ObjectToLower
} from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { DiscordBase } from './extra/DiscordBase';
import { Guild } from './Guild';

export type GuildMemberData = APIGuildMember | GatewayGuildMemberUpdateDispatchData | GatewayGuildMemberAddDispatchData | APIInteractionDataResolvedGuildMember;

import { User } from './User';
import type { Cache } from '../cache';
import { ImageOptions } from '../types/options';

export interface GuildMember extends DiscordBase, Omit<ObjectToLower<APIGuildMember>, 'user'> { }
/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class GuildMember extends DiscordBase {
	user: User;
	joinedTimestamp?: number;
	communicationDisabledUntilTimestamp?: number | null;
	private readonly __methods__!: ReturnType<typeof Guild.members>

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
			value: Guild.members({ id: this.guildId, rest: this.rest, api: this.api, cache: this.cache }),
			writable: false,
		})
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
	async fetch(force = false) {
		return Guild.members(this).fetch(this.id, force);
	}

	ban(body?: RESTPutAPIGuildBanJSONBody, reason?: string) {
		return this.__methods__.ban(this.id, body, reason);
	}

	kick(reason?: string) {
		return this.__methods__.kick(this.id, reason);
	}

	async edit(body: RESTPatchAPIGuildMemberJSONBody, reason?: string) {
		const member = await this.__methods__.edit(this.id, body, reason);
		return this._patchThis(member);
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
