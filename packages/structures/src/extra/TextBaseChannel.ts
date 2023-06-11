import type {
	APITextBasedChannel,
	ChannelType,
	RESTPostAPIChannelMessageJSONBody
} from '@biscuitland/common';
import type { RawFile } from '@discordjs/rest';
import type { ObjectToLower } from '..';
import { Webhook } from '../Webhook';
import { BaseChannel } from './BaseChannel';

export interface TextBaseChannel
	extends BaseChannel,
	ObjectToLower<APITextBasedChannel<ChannelType>> { }

export class TextBaseChannel extends BaseChannel {
	createMessage(body: RESTPostAPIChannelMessageJSONBody, files?: RawFile[]) {
		return this.api.channels(this.id).messages.post({
			body,
			files
		});
	}

	startTyping() {
		return this.api.channels(this.id).typing.post();
	}

	async fetchWebhooks() {
		return (await this.api.channels(this.id).webhooks.get()).map(w => new Webhook(this.rest, w));
	}
}
