import type { APIEmoji } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { User } from './User';
import { DiscordBase } from './extra/DiscordBase';
import type { Emoji } from './extra/Emoji';

export class GuildEmoji extends DiscordBase implements Emoji {
	// rome-ignore lint/correctness/noUnusedVariables: Declaring them here avoids reassigning them manually
	constructor(rest: BiscuitREST, data: APIEmoji, readonly guildId: string) {
		super(rest, data.id!);
		this.name = data.name!;
		this.managed = !!data.managed;
		this.animated = !!data.animated;
		this.avialable = !!data.available;
		this.requireColons = !!data.require_colons;
		this.roles = data.roles;

		if (data.user) {
			this.user = new User(this.rest, data.user);
		}
	}

	/** emoji name */
	name: string;

	/** whether this emoji is managed */
	managed: boolean;

	/** whether this emoji is animated */
	animated: boolean;

	/** whether this emoji can be used, may be false due to loss of Server Boosts */
	avialable: boolean;

	/**	whether this emoji must be wrapped in colons */
	requireColons: boolean;

	/** roles allowed to use this emoji */
	roles?: string[];

	/** user that created this emoji */
	user?: User;
}
