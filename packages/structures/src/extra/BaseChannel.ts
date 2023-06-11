// import type { BiscuitChannels } from '../index';

import type { APIChannelBase, ChannelType } from '@biscuitland/common';
import type { ObjectToLower } from '../index';
import { channelFactory, channelLink } from '../index';
import { DiscordBase } from './DiscordBase';

export interface BaceChannel extends DiscordBase, ObjectToLower<APIChannelBase<ChannelType>> { }

export class BaseChannel extends DiscordBase {
	/** The URL to the channel */
	get url() {
		return channelLink(this.id);
	}

	async fetch() {
		const channel = await this.api.channels(this.id).get();

		return channelFactory(this.rest, channel);
	}

	delete(reason?: string) {
		return this.api.channels(this.id).delete({ reason });
	}

	toString() {
		return `<#${this.id}>`;
	}
}
