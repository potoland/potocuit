import type {
	APIUser,
	GatewayUserUpdateDispatchData,
} from '@biscuitland/common';
import { DMChannel } from './DMChannel';
import { DiscordBase } from './extra/DiscordBase';
import type { ImageOptions, ObjectToLower } from './index';

export type DataUser = APIUser | GatewayUserUpdateDispatchData;

export interface User extends DiscordBase, ObjectToLower<DataUser> { }

export class User extends DiscordBase {
	get tag(): string {
		return `${this.username}#${this.discriminator}`;
	}

	avatarURL(options?: ImageOptions): string {
		if (!this.avatar) {
			return this.rest.api.cdn.defaultAvatar(Number(this.discriminator));
		}
		return this.rest.api.cdn.avatar(this.id, this.avatar, options);
	}

	/**
	 * Fetch user
	 */
	fetch() {
		return this.api.users(this.id).get().then(x => new User(this.rest, x));
	}

	/**
	 * Open a DM with the user
	 */
	createDirectMessage() {
		return this.api.users('@me').channels.post({
			body: { recipient_id: this.id },
		}).then(x => new DMChannel(this.rest, x));
	}

	toString(): string {
		return `<@${this.id}>`;
	}
}
