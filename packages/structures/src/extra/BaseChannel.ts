// import type { BiscuitChannels } from '../index';

import type { APIChannelBase, ChannelType, ObjectToLower, RESTPatchAPIChannelJSONBody } from '@biscuitland/common';
import { channelLink } from '../index';
import { DiscordBase } from './DiscordBase';

export interface BaseChannel extends ObjectToLower<APIChannelBase<ChannelType>> { }

export class BaseChannel extends DiscordBase<APIChannelBase<ChannelType>> {
	/** The URL to the channel */
	get url() {
		return channelLink(this.id);
	}

	async fetch() {
		const channel = await this.api.channels(this.id).get();
		this._patchThis(channel);
		return this;
	}

	delete(reason?: string) {
		return this.api.channels(this.id).delete({ reason });
	}

	edit(body: RESTPatchAPIChannelJSONBody) {
		return this.api.
			channels(this.id)
			.patch({ body });
	}

	toString() {
		return `<#${this.id}>`;
	}
}
