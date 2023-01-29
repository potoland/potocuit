import {
	InteractionTypes, MessageComponentTypes,
	INTERACTION_ID_TOKEN,
} from '@biscuitland/api-types';
import type {
	DiscordInteraction, DiscordInteractionDataOption,
	DiscordInteractionData
} from '@biscuitland/api-types';
import type {
	Potocuit
} from '../potocuit';
import type {
	ApplicationCommandAutocompleteResultCallback, ChannelMessageWithSourceCallback,
	DeferredChannelMessageWithSourceCallback, DeferredUpdateMessageCallback,
	ModalCallback, UpdateMessageCallback
} from './types/interaction';

type ResolveDiscordInteractionRaw<
	O extends keyof DiscordInteractionData = never,
	R extends keyof DiscordInteractionData = never,
> = Omit<DiscordInteraction, 'data'> & {
	data: Omit<DiscordInteractionData, O> & Required<Pick<DiscordInteractionData, R>>;
};

type ResolveInteraction<
	O extends keyof DiscordInteractionData = never,
	R extends keyof DiscordInteractionData = never,
	RESPOND = never
> = Omit<Interaction<RESPOND>, 'data'> & { data: ResolveDiscordInteractionRaw<O, R> };

export type ApplicationCommandInteraction = ResolveInteraction<
	// 'id'
	// | 'name'
	// | 'type'
	// | 'resolved'
	// | 'options'
	// | 'guild_id'
	// | 'target_id'
	| 'component_type'
	| 'components'
	| 'custom_id'
	| 'values',
	never,
	ChannelMessageWithSourceCallback
	| DeferredChannelMessageWithSourceCallback
	| ApplicationCommandAutocompleteResultCallback
	| ModalCallback
>;

export type AutocompleteInteraction = ResolveInteraction<
	// 'id'
	// | 'name'
	// | 'type'
	// | 'resolved'
	// | 'options'
	// | 'guild_id'
	// | 'target_id'
	| 'component_type'
	| 'components'
	| 'custom_id'
	| 'values',
	never,
	ApplicationCommandAutocompleteResultCallback
>;

export type SelectMenuInteraction = ResolveInteraction<
	'id'
	| 'name'
	| 'type'
	| 'resolved'
	| 'options'
	| 'guild_id'
	| 'target_id'
	// | 'component_type'
	| 'components'
	// | 'custom_id'
	// | 'values'
	,
	'custom_id'
	| 'component_type'
	| 'values',
	ChannelMessageWithSourceCallback
	| DeferredChannelMessageWithSourceCallback
	| DeferredUpdateMessageCallback
	| ApplicationCommandAutocompleteResultCallback
	| ModalCallback
	| UpdateMessageCallback
>;

export type ComponentInteraction = ResolveInteraction<
	'id'
	| 'name'
	| 'type'
	| 'resolved'
	| 'options'
	| 'guild_id'
	| 'target_id'
	// | 'component_type'
	| 'components'
	// | 'custom_id'
	| 'values'
	,
	'custom_id'
	| 'component_type',
	// | 'values'
	ChannelMessageWithSourceCallback
	| DeferredChannelMessageWithSourceCallback
	| DeferredUpdateMessageCallback
	| ApplicationCommandAutocompleteResultCallback
	| ModalCallback
	| UpdateMessageCallback
>;

export type ModalSubmitInteraction = ResolveInteraction<
	'id'
	| 'name'
	| 'type'
	| 'resolved'
	| 'options'
	| 'guild_id'
	| 'target_id'
	| 'component_type'
	| 'components'
	// | 'custom_id'
	| 'values'
	,
	'custom_id'
	| 'components',
	ModalCallback
>;

export class Interaction<
	T = ChannelMessageWithSourceCallback |
	DeferredChannelMessageWithSourceCallback |
	DeferredUpdateMessageCallback |
	UpdateMessageCallback |
	ApplicationCommandAutocompleteResultCallback |
	ModalCallback
> {
	data: DiscordInteraction;
	client: Potocuit;
	options: DiscordInteractionDataOption[];

	isApplicationCommand(): this is ApplicationCommandInteraction {
		return this.data.type === InteractionTypes.ApplicationCommand;
	}

	isAutocomplete(): this is AutocompleteInteraction {
		return this.data.type === InteractionTypes.ApplicationCommandAutocomplete;
	}


	isModalSubmit(): this is ModalSubmitInteraction {
		return this.data.type === InteractionTypes.ModalSubmit;
	}

	isSelectMenu(): this is SelectMenuInteraction {
		return this.data.type === InteractionTypes.MessageComponent
			&&
			[
				MessageComponentTypes.SelectMenu,
				MessageComponentTypes.UserSelect,
				MessageComponentTypes.RoleSelect,
				MessageComponentTypes.MentionableSelect,
				MessageComponentTypes.ChannelSelect,
			].includes(this.data.data!.component_type!);
	}

	isComponent(): this is ComponentInteraction {
		return this.data.type === InteractionTypes.MessageComponent;
	}

	constructor(data: DiscordInteraction, options: DiscordInteractionDataOption[], client: Potocuit) {
		this.data = data;
		this.options = options;
		this.client = client;
	}

	get author() {
		return this.data.member ? this.data.member.user : this.data.user!;
	}

	get member() {
		return this.data.member;
	}

	respond(body: T, file?: { blob: Blob; name: string }[]) {
		return this.client.rest.post(
			INTERACTION_ID_TOKEN(this.data.id, this.data.token),
			{
				file,
				...body
			}
		);
	}
}
