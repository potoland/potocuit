import type {
	APIChannel,
	APIChatInputApplicationCommandInteraction,
	APIContextMenuInteraction,
	APIDMChannel,
	APIGuildCategoryChannel,
	APIGuildForumChannel,
	APIGuildTextChannel,
	APIGuildVoiceChannel,
	APIInteraction,
	APIMessageComponentSelectMenuInteraction,
	APINewsChannel,
	APIThreadChannel,
	GuildTextChannelType,
} from '@biscuitland/common';
import {
	ApplicationCommandType,
	ChannelType,
	ComponentType,
	DiscordEpoch,
	InteractionType,
} from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
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
import { TextBaseGuildChannel } from './extra/TextBaseGuildChannel';
import { AnnouncementChannel } from './AnnouncementChannel';
import { CategoryChannel } from './CategoryChannel';
import { DMChannel } from './DMChannel';
import { ForumChannel } from './ForumChannel';
import { ThreadChannel } from './ThreadChannel';
import { VoiceChannel } from './VoiceChannel';
import type { Cache } from './cache';

export type BiscuitChannels = |
	DMChannel |
	CategoryChannel |
	ThreadChannel |
	ForumChannel |
	AnnouncementChannel |
	BaseChannel;

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
export function channelFactory(
	rest: BiscuitREST,
	cache: Cache,
	channel: { type: ChannelType },
): BiscuitChannels {
	switch (channel.type) {
		case ChannelType.GuildAnnouncement:
			return new AnnouncementChannel(rest, cache, channel as APINewsChannel);
		case ChannelType.GuildCategory:
			return new CategoryChannel(rest, cache, channel as APIGuildCategoryChannel);
		case ChannelType.GuildForum:
			return new ForumChannel(rest, cache, channel as APIGuildForumChannel);
		case ChannelType.GuildText:
			return new TextBaseGuildChannel(rest, cache, channel as APIGuildTextChannel<GuildTextChannelType>);
		case ChannelType.GuildVoice:
			return new VoiceChannel(rest, cache, channel as APIGuildVoiceChannel);
		case ChannelType.DM:
			return new DMChannel(rest, cache, channel as APIDMChannel);
		case ChannelType.PublicThread:
		case ChannelType.PrivateThread:
		case ChannelType.AnnouncementThread:
			return new ThreadChannel(rest, cache, channel as APIThreadChannel);
		default:
			return new BaseChannel(rest, cache, channel as APIChannel);
	}
}
export function interactionFactory(
	rest: BiscuitREST,
	cache: Cache,
	interaction: APIInteraction,
): BiscuitInteractions {
	switch (interaction.type) {
		case InteractionType.Ping:
			return new BaseInteraction(rest, cache, interaction);
		case InteractionType.ModalSubmit:
			return new ModalSubmitInteraction(rest, cache, interaction);
		case InteractionType.ApplicationCommandAutocomplete:
			return new AutocompleteInteraction(rest, cache, interaction);
		case InteractionType.MessageComponent: {
			switch (interaction.data.component_type) {
				case ComponentType.Button:
					return new ComponentInteraction(rest, cache, interaction);
				default:
					return new SelectMenuInteraction(
						rest, cache,
						interaction as APIMessageComponentSelectMenuInteraction,
					);
			}
		}
		case InteractionType.ApplicationCommand: {
			switch (interaction.data.type) {
				case ApplicationCommandType.ChatInput:
					return new ChatInputInteraction(
						rest, cache,
						interaction as APIChatInputApplicationCommandInteraction,
					);
				default:
					return new ContextMenuInteraction(
						rest, cache,
						interaction as APIContextMenuInteraction,
					);
			}
		}
	}
}

/** * Convert a timestamp to a snowflake. * @param timestamp The timestamp to convert. * @returns The snowflake. */
export function snowflakeToTimestamp(
	id: string,
): number {
	return (Number(id) >> 22) + DiscordEpoch;
}
