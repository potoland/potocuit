import type { APIPartialGuild, ObjectToLower } from '@biscuitland/common';
import { GuildFeature } from '@biscuitland/common';
import type { ImageOptions } from '../../types/options';
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

	/**
	 * Fetch guild on API
	 */
	async fetch() {
		const data = await this.api.guilds(this.id).get();
		await this._patchCache(data, 'guilds');
		return this;
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
	}

	toString(): string {
		return this.name;
	}
}
