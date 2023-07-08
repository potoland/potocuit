import type { GuildChannelType, RESTPostAPIChannelInviteJSONBody, RESTPostAPIChannelWebhookJSONBody, RESTPutAPIChannelPermissionJSONBody } from '@biscuitland/common';
import { BaseChannel } from './BaseChannel';
import { Webhook } from '../Webhook';
import { ExtendedInvite, channelLink } from '../';


export class BaseGuildChannel extends BaseChannel {
	declare name: string;
	declare type: GuildChannelType;
	declare guildId: string;

	get url() {
		return channelLink(this.id, this.guildId);
	}

	webhooks() {
		return {
			fetch: () => {
				return this.api
					.channels(this.id)
					.webhooks.get()
					.then(webhooks => webhooks.map(w => new Webhook(this.rest, this.cache, w)));
			},
			create: (body: RESTPostAPIChannelWebhookJSONBody, reason?: string) => {
				return this.api.channels(this.id).webhooks.post({ body, reason }).then(webhook => new Webhook(this.rest, this.cache, webhook));
			}
		};
	}

	permissions() {
		return {
			edit: (
				overwriteId: string,
				body: RESTPutAPIChannelPermissionJSONBody,
				reason?: string,
			) => {
				return this.api
					.channels(this.id)
					.permissions(overwriteId)
					.put({ body, reason });
			},
			delete: (overwriteId: string, reason?: string) => {
				return this.api
					.channels(this.id)
					.permissions(overwriteId)
					.delete({ reason });
			},
		};
	}

	invites() {
		return {
			fetch: () => {
				return this.api
					.channels(this.id)
					.invites.get()
					.then(invites =>
						invites.map(inv => new ExtendedInvite(this.rest, this.cache, inv)),
					);
			},
			create: (body: RESTPostAPIChannelInviteJSONBody, reason?: string) => {
				return this.api
					.channels(this.id)
					.invites.post({ body, reason })
					.then(inv => new ExtendedInvite(this.rest, this.cache, inv));
			},
		};
	}
}
