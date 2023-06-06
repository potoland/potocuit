import type { APIWebhook, WebhookType } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { ImageOptions } from './index';
import { AnonymousGuild } from './AnonymousGuild';
import { DiscordBase } from './extra/DiscordBase';
import { User } from './User';

export class Webhook extends DiscordBase {
	constructor(rest: BiscuitREST, data: APIWebhook) {
		super(rest, data.id);
		this.type = data.type;
		this.channelId = data.channel_id;
		this.name = data.name ?? undefined;
		this.avatar = data.avatar ?? undefined;
		this.guildId = data.guild_id;
		this.token = data.token;
		this.applicationId = data.application_id ?? undefined;

		if (data.user) {
			this.user = new User(this.rest, data.user);
			this.token = undefined;
		}

		if (data.source_guild) {
			this.sourceGuild = new AnonymousGuild(this.rest, data.source_guild);
		}
	}

	/**	the type of the webhook */
	type: WebhookType;

	/** the channel id this webhook is for, if any */
	channelId: string;

	/** the default name of the webhook */
	name?: string;

	/** the default user avatar hash of the webhook */
	avatar?: string;

	/** the guild id this webhook is for, if any */
	guildId?: string;

	/** the user this webhook was created by (not returned when getting a webhook with its token) */
	user?: User;

	/** the secure token of the webhook (returned for Incoming Webhooks) */
	token?: string;

	/**	the bot/OAuth2 application that created this webhook */
	applicationId?: string;

	/** the guild of the channel that this webhook is following (returned for Channel Follower Webhooks) */
	sourceGuild?: Partial<AnonymousGuild>;

	/**	the channel that this webhook is following (returned for Channel Follower Webhooks) */
	sourceChannel?: Partial<Record<string, any>>; // TODO

	/** the url used for executing the webhook (returned by the webhooks OAuth2 flow) */
	url?: string;

	avatarURL(options?: ImageOptions): string | null {
		if (!this.avatar) {
			return null;
		}
		return this.rest.api.cdn.avatar(this.id, this.avatar, options);
		// return formatImageURL(this.session.cdn.avatars(this.id).get(this.avatar), options?.size, options?.format);
	}
}
