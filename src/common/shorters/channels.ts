import type { RESTPatchAPIChannelJSONBody } from '..';
import { BaseChannel, Message } from '../../structures';
import channelFrom from '../../structures/channels';
import { BaseShorter } from './base';

export class ChannelShorter extends BaseShorter {
	get channels() {
		return {
			/**
			 * Fetches a channel by its ID.
			 * @param id The ID of the channel to fetch.
			 * @param force Whether to force fetching the channel from the API even if it exists in the cache.
			 * @returns A Promise that resolves to the fetched channel.
			 */
			fetch: async (id: string, force?: boolean) => {
				let channel;
				if (!force) {
					channel = await this.client.cache.channels?.get(id);
					if (channel) return channel;
				}

				channel = await this.client.proxy.channels(id).get();
				await this.client.cache.channels?.patch(id, undefined, channel);
				return channelFrom(channel, this.client);
			},

			/**
			 * Deletes a channel by its ID.
			 * @param id The ID of the channel to delete.
			 * @param optional Optional parameters for the deletion.
			 * @returns A Promise that resolves to the deleted channel.
			 */
			delete: async (id: string, optional: ChannelShorterOptionalParams = { guildId: '@me' }) => {
				const res = await this.client.proxy.channels(id).delete({ reason: optional.reason });
				await this.client.cache.channels?.removeIfNI(
					BaseChannel.__intent__(optional.guildId!),
					res.id,
					optional.guildId!,
				);
				return channelFrom(res, this.client);
			},

			/**
			 * Edits a channel by its ID.
			 * @param id The ID of the channel to edit.
			 * @param body The updated channel data.
			 * @param optional Optional parameters for the editing.
			 * @returns A Promise that resolves to the edited channel.
			 */
			edit: async (
				id: string,
				body: RESTPatchAPIChannelJSONBody,
				optional: ChannelShorterOptionalParams = { guildId: '@me' },
			) => {
				const res = await this.client.proxy.channels(id).patch({ body, reason: optional.reason });
				await this.client.cache.channels?.setIfNI(
					BaseChannel.__intent__(optional.guildId!),
					res.id,
					optional.guildId!,
					res,
				);
				return channelFrom(res, this.client);
			},

			/**
			 * Sends a typing indicator to the channel.
			 * @param id The ID of the channel.
			 * @returns A Promise that resolves when the typing indicator is successfully sent.
			 */
			typing: (id: string) => this.client.proxy.channels(id).typing.post(),

			/**
			 * Provides access to pinned messages in the channel.
			 */
			pins: this.pins,
		};
	}

	get pins() {
		return {
			/**
			 * Fetches pinned messages in the channel.
			 * @param channelId The ID of the channel.
			 * @returns A Promise that resolves to an array of pinned messages.
			 */
			fetch: (channelId: string) =>
				this.client.proxy
					.channels(channelId)
					.pins.get()
					.then(messages => messages.map(message => new Message(this.client, message))),

			/**
			 * Pins a message in the channel.
			 * @param messageId The ID of the message to pin.
			 * @param channelId The ID of the channel.
			 * @param reason The reason for pinning the message.
			 * @returns A Promise that resolves when the message is successfully pinned.
			 */
			set: (messageId: string, channelId: string, reason?: string) =>
				this.client.proxy.channels(channelId).pins(messageId).put({ reason }),

			/**
			 * Unpins a message in the channel.
			 * @param messageId The ID of the message to unpin.
			 * @param channelId The ID of the channel.
			 * @param reason The reason for unpinning the message.
			 * @returns A Promise that resolves when the message is successfully unpinned.
			 */
			delete: (messageId: string, channelId: string, reason?: string) =>
				this.client.proxy.channels(channelId).pins(messageId).delete({ reason }),
		};
	}
}

export type ChannelShorterOptionalParams = Partial<{ guildId: string; reason: string }>;
