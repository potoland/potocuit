import type { APIPartialEmoji, ChannelType, RESTGetAPIChannelMessageReactionUsersQuery, RESTPatchAPIChannelMessageJSONBody, RESTPostAPIChannelMessageJSONBody, RESTPostAPIChannelMessagesBulkDeleteJSONBody } from '@biscuitland/common';
import type { RawFile } from '@biscuitland/rest';
import { encodeEmoji, resolveEmoji } from '../../extra/functions';
import { User } from '../../User';
import { Message } from '../../Message';
import type { MethodContext } from '../../..';
import type { EmojiResolvable } from '../../../types/resolvables';
import { DiscordBase } from '../../extra/DiscordBase';
import type { BaseChannel } from './base';
import type { MessageCreateBodyRequest, MessageUpdateBodyRequest } from '../../../types/write';

export interface MessagesMethods extends BaseChannel<ChannelType.GuildText> { }
export class MessagesMethods extends DiscordBase {
	typing() {
		return this.api.channels(this.id).typing.post();
	}

	// creo que esto da error de runtime XDDDDDD si no mal recuerdo me paso algo parecido en biscuit
	// era algo como que esto se iniciaba antes que el constructor y this daba error, aunque supongo que aqui no pasa nada
	// solo afectaria a los que tengan constructor i guess
	messages = MessagesMethods.messages(this);
	pins = MessagesMethods.pins(this);
	reactions = MessagesMethods.reactions(this);
	static reactions(ctx: MethodContext) {
		return {
			add: async (messageId: string, emoji: EmojiResolvable) => {
				const rawEmoji = await resolveEmoji(emoji, ctx.client.cache);

				// en una de esas creamos una clase de error
				if (!rawEmoji) {
					throw new Error('Emoji no resolvable');
				}

				return ctx.api
					.channels(ctx.id)
					.messages(messageId)
					.reactions(encodeEmoji(rawEmoji))('@me')
					.put({});
			},
			delete: async (
				messageId: string,
				emoji: EmojiResolvable,
				userId = '@me',
			) => {
				const rawEmoji = await resolveEmoji(emoji, ctx.client.cache);

				// en una de esas creamos una clase de error
				if (!rawEmoji) {
					throw new Error('Emoji no resolvable');
				}

				return ctx.api
					.channels(ctx.id)
					.messages(messageId)
					.reactions(encodeEmoji(rawEmoji))(userId)
					.delete();
			},
			fetch: async (
				messageId: string,
				emoji: EmojiResolvable,
				query?: RESTGetAPIChannelMessageReactionUsersQuery,
			) => {
				const rawEmoji = await resolveEmoji(emoji, ctx.client.cache);

				// en una de esas creamos una clase de error
				if (!rawEmoji) {
					throw new Error('Emoji no resolvable');
				}


				return ctx.api
					.channels(ctx.id)
					.messages(messageId)
					.reactions(encodeEmoji(rawEmoji))
					.get({ query })
					.then(u => u.map(user => new User(ctx.client, user)));
			},
			purge: async (messageId: string, emoji?: string | Partial<APIPartialEmoji>) => {
				if (!emoji) {
					return ctx.api
						.channels(ctx.id)
						.messages(messageId)
						.reactions.delete();
				}

				const rawEmoji = await resolveEmoji(emoji, ctx.client.cache);
				// en una de esas creamos una clase de error
				if (!rawEmoji) {
					throw new Error('Emoji no resolvable');
				}

				return ctx.api
					.channels(ctx.id)
					.messages(messageId)
					.reactions(encodeEmoji(rawEmoji))
					.delete();
			},
		};
	}

	static pins(ctx: MethodContext) {
		return {
			fetch: () => ctx.api.channels(ctx.id).pins.get().then(messages =>
				messages.map(message => new Message(ctx.client, message)),
			),
			set: (messageId: string, reason?: string) => ctx.api.channels(ctx.id).pins(messageId).put({ reason }),
			delete: (messageId: string, reason?: string) => ctx.api.channels(ctx.id).pins(messageId).delete({ reason }),
		};
	}

	static transformMessageBody<T>(body: MessageCreateBodyRequest | MessageUpdateBodyRequest) {
		return {
			...body,
			components: body.components ? body.components.map(x => x.toJSON()) : []
		} as T;
	}

	static messages(ctx: MethodContext) {
		return {
			write: (body: MessageCreateBodyRequest, files?: RawFile[]) => {
				const transformedBody = MessagesMethods.transformMessageBody<RESTPostAPIChannelMessageJSONBody>(body);
				return ctx.api
					.channels(ctx.id)
					.messages
					.post({
						body: transformedBody,
						files,
					})
					.then(message => {
						ctx;
						return new Message(ctx.client, message);
					});
			},
			edit: (messageId: string, body: MessageUpdateBodyRequest, files?: RawFile[]) => {
				return ctx.api.channels(ctx.id).messages(messageId).patch({ body: MessagesMethods.transformMessageBody<RESTPatchAPIChannelMessageJSONBody>(body), files }).then(m => new Message(ctx.client, m));
			},
			crosspost: (messageId: string, reason?: string) => {
				return ctx.api.channels(ctx.id).messages(messageId).crosspost.post({ reason }).then(m => new Message(ctx.client, m));
			},
			delete: (messageId: string, reason?: string) => {
				return ctx.api.channels(ctx.id).messages(messageId).delete({ reason });
			},
			fetch: async (messageId: string) => {
				return ctx.api.channels(ctx.id).messages(messageId).get()
					.then(x => new Message(ctx.client, x));
			},
			purge: (
				body: RESTPostAPIChannelMessagesBulkDeleteJSONBody,
				reason?: string,
			) => {
				return ctx.api
					.channels(ctx.id)
					.messages['bulk-delete'].post({ body, reason });
			}
		};
	}
}
