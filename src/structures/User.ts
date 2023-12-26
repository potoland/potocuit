import type { APIUser, ObjectToLower } from "@biscuitland/common";
import type { ImageOptions } from "../types/options";
import { DMChannel } from "./channels";
import { DiscordBase } from "./extra/DiscordBase";

export interface User extends ObjectToLower<APIUser> { }

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
		const data = await this.api.users(this.id).get();
		return this._patchCache(data, "users");
	}

	/**
	 * Open a DM with the user
	 */
	async dm() {
		const data = await this.api.users("@me").channels.post({
			body: { recipient_id: this.id },
		});
		await this.cache.channels?.set(data.id, "@me", data);
		return new DMChannel(this.client, data);
	}

	avatarURL(options?: ImageOptions): string {
		if (!this.avatar) {
			return this.rest.api.cdn.defaultAvatar(Number(this.discriminator));
		}
		return this.rest.api.cdn.avatar(this.id, this.avatar, options);
	}

	toString(): string {
		return `<@${this.id}>`;
	}
}
