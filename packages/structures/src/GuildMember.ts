import type {
	APIGuildMember,
	APIInteractionDataResolvedGuildMember,
	APIUser,
	GatewayGuildMemberAddDispatchData,
	GatewayGuildMemberUpdateDispatchData
} from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { DiscordBase } from './extra/DiscordBase';
import type { ImageOptions } from './index';

export type GuildMemberData = APIGuildMember | GatewayGuildMemberUpdateDispatchData | GatewayGuildMemberAddDispatchData | APIInteractionDataResolvedGuildMember;

import type { ObjectToLower } from '.';
import { User } from './User';

export interface GuildMember extends DiscordBase, Omit<ObjectToLower<APIGuildMember>, 'user'> { }
/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class GuildMember extends DiscordBase {
	user: User;
	joinedTimestamp?: number;
	communicationDisabledUntilTimestamp?: number | null;

	constructor(
		rest: BiscuitREST,
		data: GuildMemberData,
		user: APIUser,
		/** the choosen guild id */
		readonly guildId: string
	) {
		super(rest, { ...data, id: user.id });
		this.user = user instanceof User ? user : new User(rest, user);
		// this.guildId = guildId;
		// this.avatar = data.avatar ?? undefined;
		// this.nickname = data.nick ?? undefined;
		// this.premiumSince = Date.parse(data.premium_since ?? '');
		// this.roles = data.roles;
		// this.deaf = !!data.deaf;
		// this.mute = !!data.mute;
		// this.pending = !!data.pending;
		this.patch(data);
	}

	get username() {
		return this.user.username;
	}

	/** gets the nickname or the username */
	get nicknameOrUsername(): string {
		return this.nick ?? this.user.username;
	}

	dynamicAvatarURL(options?: ImageOptions): string | null {
		if (!this.avatar) {
			return this.user.avatarURL(options);
		}

		return this.rest.api.cdn.guildMemberAvatar(this.guildId, this.id, this.avatar, options);
	}

	toString(): string {
		return `<@!${this.user!.id}>`;
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
		data: APIInteractionDataResolvedGuildMember,
		user: APIUser,
		/** the choosen guild id */
		guildId: string
	) {
		super(rest, data, user, guildId);
	}
}
