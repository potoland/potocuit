import type {
	APIGuild
} from '@biscuitland/common';
import {
	GuildFeature
} from '@biscuitland/common';
import type { ImageOptions, ObjectToLower } from '..';
import { DiscordBase } from './DiscordBase';

export interface BaseGuild extends DiscordBase, ObjectToLower<APIGuild> { }
/**
 * Base guild class
 */
export class BaseGuild extends DiscordBase {
	get partnered(): boolean {
		if (!this.features) {
			return false;
		}
		return this.features.includes(GuildFeature.Partnered);
	}

	/**
	 * If the guild is verified.
	 * @link https://discord.com/developers/docs/resources/guild#guild-object-guild-features
	 */
	get verified(): boolean {
		if (!this.features) {
			return false;
		}
		return this.features.includes(GuildFeature.Verified);
	}

	/**
	 * iconURL gets the current guild icon.
	 * @link https://discord.com/developers/docs/reference#image-formatting
	 */
	iconURL(options?: ImageOptions): string | void {
		if (!this.icon) {
			return;
		}
		return this.rest.api.cdn.icon(this.id, this.icon, options);
	}

	toString(): string {
		return this.name;
	}
}
