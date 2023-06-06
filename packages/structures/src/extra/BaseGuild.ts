import type { APIGuild, APIPartialGuild } from '@biscuitland/common';
import { GuildFeature } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { ImageOptions } from '../index';
import { DiscordBase } from './DiscordBase';

/**
 * Class for {@link Guild} and {@link AnonymousGuild}
 */
export class BaseGuild extends DiscordBase {
	constructor(rest: BiscuitREST, data: APIGuild | APIPartialGuild) {
		super(rest, data.id);
		this.name = data.name;
		this.icon = data.icon ?? undefined;
		this.features = data.features;
	}

	/** Guild name. */
	name: string;

	/**
	 * Icon hash. Discord uses ids and hashes to render images in the client.
	 * @link https://discord.com/developers/docs/reference#image-formatting
	 */
	icon?: string;

	/**
	 * Enabled guild features (animated banner, news, auto moderation, etc).
	 * @link https://discord.com/developers/docs/resources/guild#guild-object-guild-features
	 */
	features?: `${GuildFeature}`[];

	/**
	 * If the guild features includes partnered.
	 * @link https://discord.com/developers/docs/resources/guild#guild-object-guild-features
	 */
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
	get verifed(): boolean {
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
