import type {
	APIGuild, APIGuildMember, GatewayGuildCreateDispatchData, RESTPatchAPIGuildRoleJSONBody, RESTPostAPIGuildRoleJSONBody
} from '@biscuitland/common';
import {
	toCamelCase
} from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { ObjectToLower } from '.';
import { AnonymousGuild } from './AnonymousGuild';

export interface Guild extends AnonymousGuild, ObjectToLower<APIGuild> { }

export class Guild extends AnonymousGuild {
	members?: ObjectToLower<APIGuildMember>[];
	constructor(rest: BiscuitREST, data: APIGuild | GatewayGuildCreateDispatchData) {
		super(rest, data);
		this.gatewayPatch(data);
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

	/** Returns the maximum number of emoji slots */
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

	/**
	 * Get guild template if existing
	 */
	getTemplates() {
		return this.api.guilds(this.id).templates.get();
	}

	/**
	 * Get guild stickers
	 */
	getStickers() {
		return this.api.guilds(this.id).stickers.get();
	}

	/**
	 * Get guild emojis
	 */
	getEmojis() {
		return this.api.guilds(this.id).emojis.get();
	}

	/**
	 * Creates a role
	 * @param body Body of the request
	 */
	createRole(body: RESTPostAPIGuildRoleJSONBody) {
		return this.api.guilds(this.id).roles.post({
			body
		});
	}

	/**
	 * Deletes a role
	 * @param roleId ID of the role to delete
	 */
	deleteRole(roleId: string) {
		return this.api.guilds(this.id).roles(roleId).delete();
	}

	/**
	 * Deletes a role
	 * @param roleId ID of the role to delete
	 */
	editRole(roleId: string, body: RESTPatchAPIGuildRoleJSONBody) {
		return this.api.guilds(this.id).roles(roleId).patch({
			body
		});
	}

	/**
	 * Assigns a role to a member
	 * @param memberId ID of the member
	 * @param roleId ID of the role
	 */
	assignRole(memberId: string, roleId: string) {
		return this.api.guilds(this.id).members(memberId).roles(roleId).put({});
	}


	private gatewayPatch(data: APIGuild | GatewayGuildCreateDispatchData) {
		if ('members' in data && data.members.length) {
			this.members = data.members.map(x => toCamelCase(x as any) as ObjectToLower<APIGuildMember>);
			// this.members = new Map(
			// data.members.map(member => [`${member.user?.id}`, new GuildMember(this.rest, member, this.id)])
			// );
		}

		// 	this.joinedAt = data.joined_at;
		// 	this.large = !!data.large;
		// 	this.memberCount = data.member_count;
		// 	this.unavailable = !!data.unavailable;
	}
}

/** Maximun custom guild emojis per level */
export type MaxEmojis = 50 | 100 | 150 | 250;

/** Maximun custom guild stickers per level */
export type MaxStickers = 5 | 15 | 30 | 60;
