import { APIPartialEmoji, RESTGetAPIChannelMessageReactionUsersQuery, RESTPostAPIChannelMessageJSONBody, RESTPatchAPIChannelMessageJSONBody, RESTPostAPIChannelMessagesBulkDeleteJSONBody } from "@biscuitland/common";
import { BiscuitREST, RawFile, Routes } from "@biscuitland/rest";
import { encodeEmoji, resolveEmoji } from "../../extra/functions"
import { Cache } from "../../../cache";
import { User } from "../../User";
import { Message } from "../../Message";
import { MethodContext } from "../../..";
import { EmojiResolvable } from "../../../types/resolvables";

export class MessagesMethod {
	//channelId
	id!: string
	rest!: BiscuitREST;
	cache!: Cache
	readonly api!: Routes;

	typing() {
		return this.api.channels(this.id).typing.post();
	}

	// creo que esto da error de runtime XDDDDDD si no mal recuerdo me paso algo parecido en biscuit
	// era algo como que esto se iniciaba antes que el constructor y this daba error, aunque supongo que aqui no pasa nada
	// solo afectaria a los que tengan constructor i guess
	messages = MessagesMethod.messages(this);
	pins = MessagesMethod.pins(this);
	reactions = MessagesMethod.reactions(this);
	static reactions(ctx: MethodContext) {
		return {
			add: async (messageId: string, emoji: EmojiResolvable) => {
				const rawEmoji = await resolveEmoji(emoji, ctx.cache);

				// en una de esas creamos una clase de error
				if (!rawEmoji) {
					throw new Error('Emoji no resolvable')
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
				const rawEmoji = await resolveEmoji(emoji, ctx.cache);

				// en una de esas creamos una clase de error
				if (!rawEmoji) {
					throw new Error('Emoji no resolvable')
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
				const rawEmoji = await resolveEmoji(emoji, ctx.cache);

				// en una de esas creamos una clase de error
				if (!rawEmoji) {
					throw new Error('Emoji no resolvable')
				}
				;

				return ctx.api
					.channels(ctx.id)
					.messages(messageId)
					.reactions(encodeEmoji(rawEmoji))
					.get({ query })
					.then(u => u.map(user => new User(ctx.rest, ctx.cache, user)));
			},
			purge: async (messageId: string, emoji?: string | Partial<APIPartialEmoji>) => {
				if (!emoji) {
					return ctx.api
						.channels(ctx.id)
						.messages(messageId)
						.reactions.delete();
				}

				const rawEmoji = await resolveEmoji(emoji, ctx.cache);
				// en una de esas creamos una clase de error
				if (!rawEmoji) {
					throw new Error('Emoji no resolvable')
				}

				return ctx.api
					.channels(ctx.id)
					.messages(messageId)
					.reactions(encodeEmoji(rawEmoji))
					.delete();
			},
		}
	}

	static pins(ctx: MethodContext) {
		return {
			fetch: () => ctx.api.channels(ctx.id).pins.get().then(messages =>
				messages.map(message => new Message(ctx.rest, ctx.cache, message)),
			),
			set: (messageId: string, reason?: string) => ctx.api.channels(ctx.id).pins(messageId).put({ reason }),
			delete: (messageId: string, reason?: string) => ctx.api.channels(ctx.id).pins(messageId).delete({ reason }),
		}
	}


	static messages(ctx: MethodContext) {
		return {
			write: (body: RESTPostAPIChannelMessageJSONBody, files?: RawFile[]) => {
				return ctx.api
					.channels(ctx.id)
					.messages.post({
						body,
						files,
					})
					.then(message => new Message(ctx.rest, ctx.cache, message));
			},
			edit: (messageId: string, body: RESTPatchAPIChannelMessageJSONBody, files?: RawFile[]) => {
				return ctx.api.channels(ctx.id).messages(messageId).patch({ body, files }).then(m => new Message(ctx.rest, ctx.cache, m));
			},
			crosspost: (messageId: string, reason?: string) => {
				return ctx.api.channels(ctx.id).messages(messageId).crosspost.post({ reason }).then(m => new Message(ctx.rest, ctx.cache, m));
			},
			delete: (messageId: string, reason?: string) => {
				return ctx.api.channels(ctx.id).messages(messageId).delete({ reason });
			},
			fetch: async (messageId: string) => {
				return ctx.api.channels(ctx.id).messages(messageId).get()
					.then(x => new Message(ctx.rest, ctx.cache, x));
			},
			purge: (
				body: RESTPostAPIChannelMessagesBulkDeleteJSONBody,
				reason?: string,
			) => {
				return ctx.api
					.channels(ctx.id)
					.messages['bulk-delete'].post({ body, reason });
			}
		}
	}
}
