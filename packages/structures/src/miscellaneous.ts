import type {
	APIChannel,
	APIChatInputApplicationCommandInteraction,
	APIContextMenuInteraction,
	APIDMChannel,
	APIInteraction,
	APIMessageComponentSelectMenuInteraction,
	CamelCase,
	Identify,
	SnakeCase,
} from '@biscuitland/common';
import {
	ApplicationCommandType,
	ChannelType,
	ComponentType,
	DiscordEpoch,
	InteractionType,
} from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { DMChannel } from './DMChannel';
import {
	AutocompleteInteraction,
	BaseInteraction,
	ChatInputInteraction,
	ComponentInteraction,
	ContextMenuInteraction,
	ModalSubmitInteraction,
	SelectMenuInteraction,
} from './Interaction';
import { BaseChannel } from './extra/BaseChannel';
export type BiscuitChannels = DMChannel | BaseChannel;
export type BiscuitInteractions =
	| ComponentInteraction
	| SelectMenuInteraction
	| ModalSubmitInteraction
	| AutocompleteInteraction
	| ChatInputInteraction
	| ContextMenuInteraction
	| BaseInteraction;
export type ImageOptions = NonNullable<
	Parameters<BiscuitREST['api']['cdn']['icon']>[2]
>;
export function channelLink(channelId: string, guildId?: string) {
	return `https://discord.com/channels/${guildId ?? '@me'}/${channelId}`;
}
export function channelFactory(
	rest: BiscuitREST,
	channel: { type: ChannelType },
): BiscuitChannels {
	switch (channel.type) {
		case ChannelType.DM:
			return new DMChannel(rest, channel as APIDMChannel);
		default:
			return new BaseChannel(rest, channel as APIChannel);
	}
}
export function interactionFactory(
	rest: BiscuitREST,
	interaction: APIInteraction,
): BiscuitInteractions {
	switch (interaction.type) {
		case InteractionType.Ping:
			return new BaseInteraction(rest, interaction);
		case InteractionType.ModalSubmit:
			return new ModalSubmitInteraction(rest, interaction);
		case InteractionType.ApplicationCommandAutocomplete:
			return new AutocompleteInteraction(rest, interaction);
		case InteractionType.MessageComponent: {
			switch (interaction.data.component_type) {
				case ComponentType.Button:
					return new ComponentInteraction(rest, interaction);
				default:
					return new SelectMenuInteraction(
						rest,
						interaction as APIMessageComponentSelectMenuInteraction,
					);
			}
		}
		case InteractionType.ApplicationCommand: {
			switch (interaction.data.type) {
				case ApplicationCommandType.ChatInput:
					return new ChatInputInteraction(
						rest,
						interaction as APIChatInputApplicationCommandInteraction,
					);
				default:
					return new ContextMenuInteraction(
						rest,
						interaction as APIContextMenuInteraction,
					);
			}
		}
	}
}

/** * Convert a timestamp to a snowflake. * @param timestamp The timestamp to convert. * @returns The snowflake. */ export function snowflakeToTimestamp(
	id: string,
): number {
	return (Number(id) >> 22) + DiscordEpoch;
}
export type ObjectToLower<T> = Identify<{
	[K in
	keyof T as CamelCase<Exclude<K, symbol | number>>]: T[K] extends unknown[]
	? Identify<ObjectToLower<T[K][0]>[]>
	: T[K] extends object
	? Identify<ObjectToLower<T[K]>>
	: T[K];
}>;
export type ObjectToSnake<T> = Identify<{
	[K in
	keyof T as SnakeCase<Exclude<K, symbol | number>>]: T[K] extends unknown[]
	? Identify<ObjectToSnake<T[K][0]>[]>
	: T[K] extends object
	? Identify<ObjectToSnake<T[K]>>
	: T[K];
}>;
