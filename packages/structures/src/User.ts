import type { APIUser, GatewayUserUpdateDispatchData, UserFlags } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { DiscordBase } from './extra/DiscordBase';
import type { ImageOptions } from './index';

export type DataUser = APIUser | GatewayUserUpdateDispatchData;

export class User extends DiscordBase {
	constructor(rest: BiscuitREST, data: DataUser) {
		super(rest, data.id);
		this.username = data.username;
		this.discriminator = data.discriminator;
		this.avatar = data.avatar ?? undefined;
		this.accentColor = data.accent_color ?? undefined;
		this.bot = !!data.bot;
		this.system = !!data.system;
		this.banner = data.banner;
		this.publicFlags = data.public_flags;
	}

	/** the user's username, not unique across the platform */
	username: string;

	/** the user's 4-digit discord-tag */
	discriminator: string;

	/** the user's avatar hash */
	avatar?: string;

	/** the user's banner color encoded as an integer representation of hexadecimal color code */
	accentColor?: number;

	/** whether the user belongs to an OAuth2 application */
	bot: boolean;

	/** whether the user is an Official Discord System user (part of the urgent message system) */
	system: boolean;

	/** the user's banner hash, only represent on fetch */
	banner?: string | null;

	/** the public flags on a user's account */
	publicFlags?: UserFlags;

	get tag(): string {
		return `${this.username}#${this.discriminator}`;
	}

	avatarURL(options?: ImageOptions): string {
		if (!this.avatar) {
			return this.rest.api.cdn.defaultAvatar(Number(this.discriminator));
		}
		return this.rest.api.cdn.avatar(this.id, this.avatar, options);
		// return formatImageURL(this.session.cdn.avatars(this.id).get(this.avatar), options?.size, options?.format);
	}

	fetch(): Promise<User | undefined> {
		return this.api.users(this.id).get().then(x => new User(this.rest, x));
		// return this.session.managers.users.fetch(this.id);
	}

	toString(): string {
		return `<@${this.id}>`;
	}
}
