import type { APIWebhook, ObjectToLower, RESTPatchAPIWebhookJSONBody, RESTPatchAPIWebhookWithTokenJSONBody, RESTPatchAPIWebhookWithTokenMessageJSONBody, RESTPostAPIWebhookWithTokenJSONBody, RESTPostAPIWebhookWithTokenQuery } from '@biscuitland/common';
import type { BiscuitREST, RawFile } from '@biscuitland/rest';
import { AnonymousGuild } from './AnonymousGuild';
import { User } from './User';
import { DiscordBase } from './extra/DiscordBase';
import { Message } from './Message';
import type { ImageOptions } from './index';
import type { Cache } from './cache';


export interface Webhook extends DiscordBase, ObjectToLower<Omit<APIWebhook, 'user' | 'source_guild'>> { }

export class Webhook extends DiscordBase {
	user?: User;
	sourceGuild?: Partial<AnonymousGuild>;
	constructor(rest: BiscuitREST, cache: Cache, data: APIWebhook) {
		super(rest, cache, data);

		if (data.user) {
			this.user = new User(this.rest, this.cache, data.user);
		}

		if (data.source_guild) {
			this.sourceGuild = new AnonymousGuild(this.rest, this.cache, data.source_guild);
		}
	}

	avatarURL(options?: ImageOptions): string | null {
		if (!this.avatar) {
			return null;
		}

		return this.rest.api.cdn.avatar(this.id, this.avatar, options);
	}

	async fetch(token = this.token) {
		let webhook;
		if (token) {
			// @ts-expect-error another typo on biscuit/rest
			webhook = await this.api.webhooks(this.id)(token).get({ auth: false });
		} else {
			webhook = await this.api.webhooks(this.id).get();
		}

		return this._patchThis(webhook);
	}

	edit(body: RESTPatchAPIWebhookWithTokenJSONBody, reason?: string): Promise<this>;
	async edit(body: RESTPatchAPIWebhookJSONBody, reason?: string, token = this.token) {
		let webhook;
		if (token) {
			// @ts-expect-error another typo on biscuit/rest
			webhook = await this.api.webhooks(this.id)(token).patch({ body, reason, auth: false });
		} else {
			webhook = await this.api.webhooks(this.id).patch({ body, reason });
		}

		return this._patchThis(webhook);
	}

	async delete(reason?: string, token = this.token) {
		if (token) {
			// @ts-expect-error another typo on biscuit/rest
			await this.api.webhooks(this.id)(token).delete({ reason, auth: false });
		} else {
			await this.api.webhooks(this.id).delete({ reason });
		}
	}

	// soon tm
	// slack(body: restpostapiwebhookwithtoken, query?: RESTPostAPIWebhookWithTokenSlackQuery)

	messages() {
		return {
			// probablemente sea mejor pasar esto a un type y asi recibir un objeto en vez de params
			write: (body: RESTPostAPIWebhookWithTokenJSONBody, files?: RawFile[], query?: RESTPostAPIWebhookWithTokenQuery) => {
				if (!this.token) {
					throw new Error('Unavailable webhook token');
				}
				return this.api.webhooks(this.id)(this.token).post({ body, query, files }).then(m => m ? new Message(this.rest, this.cache, m) : null);
			},
			edit: (messageId: string, body: RESTPatchAPIWebhookWithTokenMessageJSONBody, files?: RawFile[], query?: { thread_id?: string }) => {
				if (!this.token) {
					throw new Error('Unavailable webhook token');
				}
				return this.api.webhooks(this.id)(this.token).messages(messageId).patch({ body, files, query }).then(m => new Message(this.rest, this.cache, m));
			},
			delete: (messageId: string) => {
				if (!this.token) {
					throw new Error('Unavailable webhook token');
				}
				return this.api.webhooks(this.id)(this.token).messages(messageId).delete();
			}
		};
	}
}
