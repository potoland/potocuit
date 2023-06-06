import type {
	APIChannel,
	APIDMChannel,
	APIGroupDMChannel,
	APIGuildTextChannel,
	GuildTextChannelType
} from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { BaseChannel } from './BaseChannel';

export class TextBaseChannel extends BaseChannel {
	constructor(rest: BiscuitREST, data: APIGuildTextChannel<GuildTextChannelType> | APIDMChannel | APIGroupDMChannel) {
		super(rest, data as APIChannel);
	}

	async sendTyping() {
		await this.api.channels(this.id).typing.post();
	}

	// fetchWebhoks() {
	// 	return this.api.channels(this.id).webhooks.get();
	// }
}
