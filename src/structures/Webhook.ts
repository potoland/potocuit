import type {
	Guild,
	ImageOptions,
	MessageWebhookCreateBodyRequest,
	MessageWebhookPayload,
	MessageWebhookUpdateBodyRequest,
	MethodContext,
} from '..';
import { hasProp } from '..';
import type { BaseClient } from '../client/base';
import type {
	APIWebhook,
	ObjectToLower,
	RESTGetAPIWebhookWithTokenMessageQuery,
	RESTPatchAPIWebhookJSONBody,
	RESTPatchAPIWebhookWithTokenJSONBody,
	RESTPatchAPIWebhookWithTokenMessageJSONBody,
	RESTPostAPIWebhookWithTokenJSONBody,
	RESTPostAPIWebhookWithTokenQuery,
} from '../common';
import { AnonymousGuild } from './AnonymousGuild';
import { WebhookMessage } from './Message';
import { User } from './User';
import { DiscordBase } from './extra/DiscordBase';
import { MessagesMethods } from './methods/channels';

export interface Webhook extends DiscordBase, ObjectToLower<Omit<APIWebhook, 'user' | 'source_guild'>> { }

export class Webhook extends DiscordBase {
	private readonly __methods__!: ReturnType<typeof Webhook.methods>;
	user?: User;
	sourceGuild?: Partial<AnonymousGuild>;
	messages!: ReturnType<typeof Webhook.messages>;
	constructor(client: BaseClient, data: APIWebhook) {
		super(client, data);

		if (data.user) {
			this.user = new User(this.client, data.user);
		}

		if (data.source_guild) {
			this.sourceGuild = new AnonymousGuild(this.client, data.source_guild);
		}

		Object.assign(this, {
			__methods__: Webhook.methods({ client, webhookId: this.id, webhookToken: this.token }),
		});
		Object.assign(this, {
			messages: Webhook.messages({ client, webhookId: this.id, webhookToken: this.token! }),
		});
	}

	async guild(force?: true): Promise<Guild<'api'> | undefined>;
	async guild(force?: boolean): Promise<Guild<'cached'> | Guild<'api'> | undefined>;
	async guild(force = false): Promise<Guild<'cached'> | Guild<'api'> | undefined> {
		if (!this.sourceGuild?.id) return;
		return this.client.guilds.fetch(this.sourceGuild.id, force);
	}

	async channel(force = false) {
		if (!this.sourceChannel?.id) return;
		return this.client.channels.fetch(this.sourceChannel.id, force);
	}

	avatarURL(options?: ImageOptions): string | null {
		if (!this.avatar) {
			return null;
		}

		return this.rest.cdn.avatar(this.id, this.avatar, options);
	}

	async fetch() {
		return this.__methods__.fetch().then(this._patchThis);
	}

	async edit(body: RESTPatchAPIWebhookJSONBody | RESTPatchAPIWebhookWithTokenJSONBody, reason?: string) {
		return this.__methods__.edit(body, reason).then(this._patchThis);
	}

	delete(reason?: string) {
		return this.__methods__.delete(reason);
	}

	static messages(ctx: MethodContext<{ webhookId: string, webhookToken: string }>) {
		return {
			write: async ({
				body,
				...payload
			}: MessageWebhookPayload<MessageWebhookCreateBodyRequest, { query?: RESTPostAPIWebhookWithTokenQuery }>) => {
				const transformedBody = MessagesMethods.transformMessageBody<RESTPostAPIWebhookWithTokenJSONBody>(body);
				return ctx.client.proxy
					.webhooks(ctx.webhookId)(ctx.webhookToken)
					.post({ ...payload, body: transformedBody })
					.then((m) => (m?.id ? new WebhookMessage(ctx.client, m, ctx.webhookToken) : null));
			},
			edit: async ({
				messageId,
				body,
				...json
			}: MessageWebhookPayload<
				MessageWebhookUpdateBodyRequest,
				{ messageId: string; query?: RESTGetAPIWebhookWithTokenMessageQuery }
			>) => {
				const transformedBody = MessagesMethods.transformMessageBody<RESTPatchAPIWebhookWithTokenMessageJSONBody>(body);

				return ctx.client.proxy
					.webhooks(ctx.webhookId)(ctx.webhookToken)
					.messages(messageId)
					.patch({ ...json, auth: false, body: transformedBody })
					.then((m) => new WebhookMessage(ctx.client, m, ctx.webhookToken));
			},
			delete: async (messageId: string, reason?: string) => {
				return ctx.client.proxy.webhooks(ctx.webhookId)(ctx.webhookToken).messages(messageId).delete({ reason });
			},
		};
	}

	static methods(ctx: MethodContext<{ webhookId: string, webhookToken?: string }>) {
		return {
			delete: (reason?: string) => {
				if (ctx.webhookToken) {
					return ctx.client.proxy.webhooks(ctx.webhookId)(ctx.webhookToken).delete({ reason, auth: false });
				}
				return ctx.client.proxy.webhooks(ctx.webhookId).delete({ reason });
			},
			edit: (body: RESTPatchAPIWebhookWithTokenJSONBody | RESTPatchAPIWebhookJSONBody, reason?: string) => {
				if (ctx.webhookToken) {
					return ctx.client.proxy.webhooks(ctx.webhookId)(ctx.webhookToken).patch({ body, reason, auth: false });
				}
				return ctx.client.proxy.webhooks(ctx.webhookId).patch({ body, reason });
			},
			fetch: async () => {
				let webhook;
				if (ctx.webhookToken) {
					webhook = await ctx.client.proxy.webhooks(ctx.webhookId)(ctx.webhookToken).get({ auth: false });
				} else {
					webhook = await ctx.client.proxy.webhooks(ctx.webhookId).get();
				}
				return new Webhook(ctx.client, webhook);
			},
		};
	}

	protected static _hasToken(ctx: { token?: string }): asserts ctx is { token: string } {
		if (!hasProp(ctx, 'token')) {
			throw new Error('Unavailable webhook token');
		}
	}
}
