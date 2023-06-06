import type { APIChannel, APIDMChannel } from '@biscuitland/common';
import { ChannelType, DiscordEpoch } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { DMChannel } from './DMChannel';
import { BaseChannel } from './extra/BaseChannel';

export type BiscuitChannels = DMChannel | BaseChannel;

export type ImageOptions = NonNullable<Parameters<BiscuitREST['api']['cdn']['icon']>[2]>;

export function channelLink(channelId: string, guildId?: string) {
	return `https://discord.com/channels/${guildId ?? '@me'}/${channelId}`;
}

export function channelFactory(rest: BiscuitREST, channel: { type: ChannelType }): BiscuitChannels {
	switch (channel.type) {
		case ChannelType.DM:
			return new DMChannel(rest, channel as APIDMChannel);
		default:
			return new BaseChannel(rest, channel as APIChannel);
	}
}

/**
 * Convert a timestamp to a snowflake.
 * @param timestamp The timestamp to convert.
 * @returns The snowflake.
 */
export function snowflakeToTimestamp(id: string): number {
	return (Number(id) >> 22) + DiscordEpoch;
}
