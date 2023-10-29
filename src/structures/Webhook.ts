import type { APIWebhook, ObjectToLower, RESTGetAPIWebhookWithTokenMessageQuery, RESTPatchAPIWebhookJSONBody, RESTPatchAPIWebhookWithTokenJSONBody, RESTPatchAPIWebhookWithTokenMessageJSONBody, RESTPostAPIWebhookWithTokenJSONBody, RESTPostAPIWebhookWithTokenQuery } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { AnonymousGuild } from './AnonymousGuild';
import { User } from './User';
import { DiscordBase } from './extra/DiscordBase';
import type { Cache } from '../cache';
import type { ImageOptions, MessagePayload, MethodContext } from '..';
import { hasProp } from '..';
import { Message } from './Message';

export interface Webhook extends DiscordBase, ObjectToLower<Omit<APIWebhook, 'user' | 'source_guild'>> { }

export class Webhook extends DiscordBase {
	private readonly __methods__!: ReturnType<typeof Webhook.methods>;
	user?: User;
	sourceGuild?: Partial<AnonymousGuild>;
	messages!: ReturnType<typeof Webhook.messages>;
	constructor(rest: BiscuitREST, cache: Cache, data: APIWebhook) {
		super(rest, cache, data);

		if (data.user) {
			this.user = new User(this.rest, this.cache, data.user);
		}

		if (data.source_guild) {
			this.sourceGuild = new AnonymousGuild(this.rest, this.cache, data.source_guild);
		}

		Object.defineProperty(this, '__methods__', {
			value: Webhook.methods({ rest: this.rest, cache: this.cache, id: this.id, api: this.api, token: this.token }),
			writable: false,
		});
		Object.defineProperty(this, 'messages', {
			value: Webhook.messages({ rest: this.rest, cache: this.cache, id: this.id, api: this.api, token: this.token! }),
			writable: false
		});
	}

	// set token(token: string) {
	// 	this.token = token;
	// }

	avatarURL(options?: ImageOptions): string | null {
		if (!this.avatar) {
			return null;
		}

		return this.rest.api.cdn.avatar(this.id, this.avatar, options);
	}

	async fetch(force?: boolean) {
		return this.__methods__.fetch(force).then(this._patchThis);
	}

	// edit(body: RESTPatchAPIWebhookWithTokenJSONBody, reason?: string): Promise<this>;
	async edit(body: RESTPatchAPIWebhookJSONBody | RESTPatchAPIWebhookWithTokenJSONBody, reason?: string) {
		return this.__methods__.edit(body, reason).then(this._patchThis);
	}

	delete(reason?: string) {
		return this.__methods__.delete(reason);
	}

	// se supone que token deberia ser siempre string porque todos los metodos que da la funcion necesitan token
	static messages(ctx: MethodContext<{ token?: string }>) {
		return {
			write: async (payload: MessagePayload<RESTPostAPIWebhookWithTokenJSONBody, { query?: RESTPostAPIWebhookWithTokenQuery }>,) => {
				Webhook._hasToken(ctx);
				return ctx.api.webhooks(ctx.id)(ctx.token).post(payload).then(m => m ? new Message(ctx.rest, ctx.cache, m) : null);
			},
			edit: async ({ messageId, ...json }: MessagePayload<RESTPatchAPIWebhookWithTokenMessageJSONBody, { messageId: string; query?: RESTGetAPIWebhookWithTokenMessageQuery }>) => {
				Webhook._hasToken(ctx);
				return ctx.api.webhooks(ctx.id)(ctx.token).messages(messageId).patch(json).then(m => new Message(ctx.rest, ctx.cache, m));
			},
			delete: async (messageId: string) => {
				Webhook._hasToken(ctx);
				return ctx.api.webhooks(ctx.id)(ctx.token).messages(messageId).delete();
			}
		};
	}

	static methods(ctx: MethodContext<{ token?: string }>) {
		return {
			delete: (reason?: string) => {
				if (ctx.token) { return ctx.api.webhooks(ctx.id)(ctx.token).delete({ reason, auth: false }); }
				return ctx.api.webhooks(ctx.id).delete({ reason });
			},
			edit: (body: RESTPatchAPIWebhookWithTokenJSONBody | RESTPatchAPIWebhookJSONBody, reason?: string) => {
				if (ctx.token) { return ctx.api.webhooks(ctx.id)(ctx.token).patch({ body, reason, auth: false }); }
				return ctx.api.webhooks(ctx.id).patch({ body, reason });
			},
			fetch: async (force = false) => {
				let webhook;
				if (!force) {
					// xd
				}
				if (ctx.token) { webhook = await ctx.api.webhooks(ctx.id)(ctx.token).get({ auth: false }); } else { webhook = await ctx.api.webhooks(ctx.id).get(); }
				return new Webhook(ctx.rest, ctx.cache, webhook);
			}
		};
	}

	protected static _hasToken(ctx: { token?: string }): asserts ctx is { token: string } {
		if (!hasProp(ctx, 'token')) { throw new Error('Unavailable webhook token'); }
	}
}
