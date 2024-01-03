import { RESTPatchAPIChannelJSONBody } from '..';
import { Message } from '../../structures';
import channelFrom, { BaseChannel } from '../../structures/methods/channels';
import { BaseShorter } from './base';

export class ChannelShorter extends BaseShorter {
	get channels() {
		return {
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
			delete: async (id: string, optional: ChannelShorterOptionalParams = { guildId: '@me' }) => {
				const res = await this.client.proxy.channels(id).delete({ reason: optional.reason });
				await this.client.cache.channels?.removeIfNI(
					BaseChannel.__intent__(optional.guildId!),
					res.id,
					optional.guildId!,
				);
				return channelFrom(res, this.client);
			},
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
			pins: this.pins,
		};
	}

	get pins() {
		return {
			fetch: (channelId: string) =>
				this.client.proxy
					.channels(channelId)
					.pins.get()
					.then((messages) => messages.map((message) => new Message(this.client, message))),
			set: (messageId: string, channelId: string, reason?: string) =>
				this.client.proxy.channels(channelId).pins(messageId).put({ reason }),
			delete: (messageId: string, channelId: string, reason?: string) =>
				this.client.proxy.channels(channelId).pins(messageId).delete({ reason }),
		};
	}
}

export type ChannelShorterOptionalParams = Partial<{ guildId: string; reason: string }>;
