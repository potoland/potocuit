import { RawFile } from '../api';
import type { APIUser, MessageCreateBodyRequest, ObjectToLower } from '../common';
import type { ImageOptions } from '../common/types/options';
import { DiscordBase } from './extra/DiscordBase';

export interface User extends ObjectToLower<APIUser> {}

export class User extends DiscordBase<APIUser> {
	get tag(): string {
		return this.globalName ?? `${this.username}#${this.discriminator}`;
	}

	get name(): string {
		return this.globalName ?? this.username;
	}

	/**
	 * Fetch user
	 */
	async fetch() {
		const data = await this.client.users.fetch(this.id, true);
		return this._patchCache(data, 'users');
	}

	/**
	 * Open a DM with the user
	 */
	async dm(force = false) {
		return this.client.users.createDM(this.id, force);
	}

	avatarURL(options?: ImageOptions): string {
		if (!this.avatar) {
			return this.rest.cdn.defaultAvatar(Number(this.discriminator));
		}
		return this.rest.cdn.avatar(this.id, this.avatar, options);
	}

	write(body: MessageCreateBodyRequest, files?: RawFile[]) {
		return this.client.users.write(this.id, body, files);
	}

	toString(): string {
		return `<@${this.id}>`;
	}
}
