import type { APIWebhook } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { AnonymousGuild } from './AnonymousGuild';
import { User } from './User';
import { DiscordBase } from './extra/DiscordBase';
import type { ImageOptions, ObjectToLower } from './index';


export interface Webhook extends DiscordBase, ObjectToLower<Omit<APIWebhook, 'user' | 'source_guild'>> { }

export class Webhook extends DiscordBase {
	user?: User;
	sourceGuild?: Partial<AnonymousGuild>;
	constructor(rest: BiscuitREST, data: APIWebhook) {
		super(rest, data);

		if (data.user) {
			this.user = new User(this.rest, data.user);
			this.token = undefined;
		}

		if (data.source_guild) {
			this.sourceGuild = new AnonymousGuild(this.rest, data.source_guild);
		}
	}

	avatarURL(options?: ImageOptions): string | null {
		if (!this.avatar) {
			return null;
		}

		return this.rest.api.cdn.avatar(this.id, this.avatar, options);
		// return formatImageURL(this.session.cdn.avatars(this.id).get(this.avatar), options?.size, options?.format);
	}
}
