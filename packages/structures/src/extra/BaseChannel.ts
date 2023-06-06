import type { APIChannel, ChannelFlags, ChannelType } from '@biscuitland/common';
// import type { BiscuitChannels } from '../index';
import type { BiscuitREST } from '@biscuitland/rest';

import { channelFactory, channelLink } from '../index';
import { DiscordBase } from './DiscordBase';

export class BaseChannel extends DiscordBase {
	constructor(rest: BiscuitREST, data: APIChannel) {
		super(rest, data.id);
		this.type = data.type;
		this.flags = data.flags;
	}

	/** The type of channel */
	type: ChannelType;

	/** channel flags combined as a bitfield */
	flags?: ChannelFlags;

	/** The URL to the channel */
	get url() {
		return channelLink(this.id);
	}

	async fetch() {
		const channel = await this.api.channels(this.id).get();

		return channelFactory(this.rest, channel);
	}

	toString() {
		return `<#${this.id}>`;
	}
}
