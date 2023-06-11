import { BaseGuild } from './extra/BaseGuild';
import type { ImageOptions } from './index';

/**
 * Class for anonymous guilds.
 * @link https://discord.com/developers/docs/resources/guild#guild-resource
 */
export class AnonymousGuild extends BaseGuild {
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
}
