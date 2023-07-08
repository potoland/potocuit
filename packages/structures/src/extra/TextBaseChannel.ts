import type {
	APIPartialEmoji,
	APITextBasedChannel,
	ChannelType,
	ObjectToLower,
	RESTGetAPIChannelMessageReactionUsersQuery,
	RESTGetAPIChannelMessagesQuery,
	RESTPatchAPIChannelMessageJSONBody,
	RESTPostAPIChannelMessageJSONBody,
	RESTPostAPIChannelMessagesBulkDeleteJSONBody,
} from '@biscuitland/common';
import type { RawFile } from '@discordjs/rest';
import { Message, User, resolveEmoji } from '..';
import { BaseChannel } from './BaseChannel';

export interface TextBaseChannel
	extends BaseChannel,
	ObjectToLower<APITextBasedChannel<ChannelType>> { }

export class TextBaseChannel extends BaseChannel {
	typing() {
		return this.api.channels(this.id).typing.post();
	}

	reactions() {
		return {
			add: (messageId: string, emoji: string | Partial<APIPartialEmoji>) => {
				const rawEmoji = resolveEmoji(emoji);
				const encodeEmoji = rawEmoji?.id
					? `${rawEmoji.name}:${rawEmoji.id}`
					: `${rawEmoji?.name}`;

				return this.api
					.channels(this.id)
					.messages(messageId)
					.reactions(encodeEmoji)('@me')
					.put({});
			},
			delete: (
				messageId: string,
				emoji: string | Partial<APIPartialEmoji>,
				userId = '@me',
			) => {
				const rawEmoji = resolveEmoji(emoji);
				const encodeEmoji = rawEmoji?.id
					? `${rawEmoji.name}:${rawEmoji.id}`
					: `${rawEmoji?.name}`;

				return this.api
					.channels(this.id)
					.messages(messageId)
					.reactions(encodeEmoji)(userId)
					.delete();
			},
			fetch: (
				messageId: string,
				emoji: string | Partial<APIPartialEmoji>,
				query?: RESTGetAPIChannelMessageReactionUsersQuery,
			) => {
				const rawEmoji = resolveEmoji(emoji);
				const encodeEmoji = rawEmoji?.id
					? `${rawEmoji.name}:${rawEmoji.id}`
					: `${rawEmoji?.name}`;

				return this.api
					.channels(this.id)
					.messages(messageId)
					.reactions(encodeEmoji)
					.get({ query })
					.then(u => u.map(user => new User(this.rest, this.cache, user)));
			},
			purge: (messageId: string, emoji?: string | Partial<APIPartialEmoji>) => {
				if (!emoji) {
					return this.api
						.channels(this.id)
						.messages(messageId)
						.reactions.delete();
				}

				const rawEmoji = resolveEmoji(emoji);
				const encodeEmoji = rawEmoji?.id
					? `${rawEmoji.name}:${rawEmoji.id}`
					: `${rawEmoji?.name}`;

				return this.api
					.channels(this.id)
					.messages(messageId)
					.reactions(encodeEmoji)
					.delete();
			},
		};
	}

	messages() {
		return {
			write: async (body: RESTPostAPIChannelMessageJSONBody, files?: RawFile[]) => {
				return this.api
					.channels(this.id)
					.messages.post({
						body,
						files,
					})
					.then(message => new Message(this.rest, this.cache, message));
			},
			edit: (messageId: string, body: RESTPatchAPIChannelMessageJSONBody, files?: RawFile[]) => {
				return this.api.channels(this.id).messages(messageId).patch({ body, files });
			},
			fetch: (messageId: string) => {
				return this.api.channels(this.id).messages(messageId).get()
					.then(x => new Message(this.rest, this.cache, x));
			},
			list: (query?: RESTGetAPIChannelMessagesQuery) => {
				return this.api.channels(this.id).messages.get({ query })
					.then(messages => messages.map(message => new Message(this.rest, this.cache, message)));
			},
			delete: (messageId: string, reason?: string) => {
				return this.api.channels(this.id).messages(messageId).delete({ reason });
			},
			purge: (
				body: RESTPostAPIChannelMessagesBulkDeleteJSONBody,
				reason?: string,
			) => {
				return this.api
					.channels(this.id)
					.messages['bulk-delete'].post({ body, reason });
			},
			crosspost: (messageId: string, reason?: string) => {
				return this.api.channels(this.id).messages(messageId).crosspost.post({ reason });
			}
		};
	}

	pins() {
		return {
			fetch: () => {
				return this.api
					.channels(this.id)
					.pins.get()
					.then(messages =>
						messages.map(message => new Message(this.rest, this.cache, message)),
					);
			},
			set: (messageId: string, reason?: string) => {
				return this.api.channels(this.id).pins(messageId).put({ reason });
			},
			delete: (messageId: string, reason?: string) => {
				return this.api.channels(this.id).pins(messageId).delete({ reason });
			},
		};
	}
}
