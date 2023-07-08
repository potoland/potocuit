import type {
	APIPartialGuild, ObjectToLower
} from '@biscuitland/common';
import {
	GuildFeature
} from '@biscuitland/common';
import type { ImageOptions } from '..';
import { DiscordBase } from './DiscordBase';

export interface BaseGuild extends ObjectToLower<APIPartialGuild> { }
/**
 * Base guild class
 */
export class BaseGuild extends DiscordBase<APIPartialGuild> {
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

	async fetch(): Promise<this> {
		return this._patchThis((await this.api.guilds(this.id).get()));
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

	/**
	 * splashURL gets the current guild splash as a string.
	 * @link https://discord.com/developers/docs/reference#image-formatting
	 * @param options - Image options for the splash url.
	 * @returns Splash url or void.
	 */
	splashURL(options?: ImageOptions): string | void {
		if (!this.splash) {
			return;
		}
		return this.rest.api.cdn.discoverySplash(this.id, this.splash, options);
		// formatImageURL(this.session.cdn['discovery-splashes'](this.id).get(this.splash), options?.size, options?.format);
	}

	/**
	 * bannerURL gets the current guild banner as a string.
	 * @link https://discord.com/developers/docs/reference#image-formatting
	 * @param options - Image options for the banner url.
	 * @returns Banner url or void
	 */
	bannerURL(options?: ImageOptions): string | void {
		if (!this.banner) {
			return;
		}
		return this.rest.api.cdn.banner(this.id, this.banner, options);
		// formatImageURL(this.session.cdn.banners(this.id).get(this.banner), options?.size, options?.format);
	}

	toString(): string {
		return this.name;
	}
}
