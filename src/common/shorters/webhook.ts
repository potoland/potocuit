import { RESTPatchAPIWebhookJSONBody, RESTPatchAPIWebhookWithTokenJSONBody } from '..';
import {
	Attachment,
	MessageWebhookMethodEditParams,
	MessageWebhookMethodWriteParams,
	RESTPatchAPIWebhookWithTokenMessageJSONBody,
	RESTPostAPIWebhookWithTokenJSONBody,
	Webhook,
	WebhookMessage,
	resolveFiles,
} from '../..';
import { MessagesMethods } from '../../structures/methods/channels';
import { BaseShorter } from './base';

export class WebhookShorter extends BaseShorter {
	get webhooks() {
		return {
			delete: (webhookId: string, { token, reason }: WebhookShorterOptionalParams) => {
				if (token) {
					return this.client.proxy.webhooks(webhookId)(token).delete({ reason, auth: false });
				}
				return this.client.proxy.webhooks(webhookId).delete({ reason });
			},
			edit: (
				webhookId: string,
				body: RESTPatchAPIWebhookWithTokenJSONBody | RESTPatchAPIWebhookJSONBody,
				{ token, reason }: WebhookShorterOptionalParams,
			) => {
				if (token) {
					return this.client.proxy.webhooks(webhookId)(token).patch({ body, reason, auth: false });
				}
				return this.client.proxy.webhooks(webhookId).patch({ body, reason });
			},
			fetch: async (webhookId: string, token?: string) => {
				let webhook;
				if (token) {
					webhook = await this.client.proxy.webhooks(webhookId)(token).get({ auth: false });
				} else {
					webhook = await this.client.proxy.webhooks(webhookId).get();
				}
				return new Webhook(this.client, webhook);
			},
			messages: this.messages,
		};
	}

	get messages() {
		return {
			write: async (webhookId: string, token: string, { body, files, ...payload }: MessageWebhookMethodWriteParams) => {
				const transformedBody = MessagesMethods.transformMessageBody<RESTPostAPIWebhookWithTokenJSONBody>(body);
				files ??= body.files ? await resolveFiles(body.files as Attachment[]) : [];
				return this.client.proxy
					.webhooks(webhookId)(token)
					.post({ ...payload, files, body: transformedBody })
					.then((m) => (m?.id ? new WebhookMessage(this.client, m, webhookId, token) : null));
			},
			edit: async (
				webhookId: string,
				token: string,
				{ messageId, body, files, ...json }: MessageWebhookMethodEditParams,
			) => {
				const transformedBody = MessagesMethods.transformMessageBody<RESTPatchAPIWebhookWithTokenMessageJSONBody>(body);
				files ??= body.files ? await resolveFiles(body.files as Attachment[]) : [];
				return this.client.proxy
					.webhooks(webhookId)(token)
					.messages(messageId)
					.patch({ ...json, auth: false, files, body: transformedBody })
					.then((m) => new WebhookMessage(this.client, m, webhookId, token));
			},
			delete: async (webhookId: string, token: string, messageId: string, reason?: string) => {
				return this.client.proxy.webhooks(webhookId)(token).messages(messageId).delete({ reason });
			},
			fetch: async (webhookId: string, token: string, messageId: string, threadId?: string) => {
				const message = await this.client.proxy
					.webhooks(webhookId)(token)
					.messages(messageId)
					.get({ auth: false, query: { threadId } });
				return message ? new WebhookMessage(this.client, message, webhookId, token) : undefined;
			},
		};
	}
}

export type WebhookShorterOptionalParams = Partial<{ token: string; reason: string }>;