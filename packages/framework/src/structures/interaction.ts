import {
	InteractionTypes, MessageComponentTypes,
	INTERACTION_ID_TOKEN,
	ApplicationCommandTypes
} from '@biscuitland/api-types';
import type {
	DiscordInteraction,
	DiscordInteractionData,
	DiscordMessage,
	DiscordUser,
	DiscordMember
} from '@biscuitland/api-types';
import type {
	Potocuit
} from '../potocuit';
import type {
	ApplicationCommandAutocompleteResultCallback, ChannelMessageWithSourceCallback,
	DeferredChannelMessageWithSourceCallback, DeferredUpdateMessageCallback,
	ModalCallback, UpdateMessageCallback
} from './types/interaction';
import type { OptionsContext } from '../utils';

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
> & { options: OptionsContext };

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
> & { options: OptionsContext };

export type ContextMenuUserInteraction = ResolveInteraction<
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
	'target_id',
	ChannelMessageWithSourceCallback
	| DeferredChannelMessageWithSourceCallback
	| ApplicationCommandAutocompleteResultCallback
	| ModalCallback
> & { target: { user: DiscordUser; member?: DiscordMember } };

export type ContextMenuMessageInteraction = ResolveInteraction<
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
	'target_id',
	ChannelMessageWithSourceCallback
	| DeferredChannelMessageWithSourceCallback
	| ApplicationCommandAutocompleteResultCallback
	| ModalCallback
> & { target: { message: DiscordMessage } };

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
	options?: OptionsContext;
	target?: { message?: DiscordMessage; user?: DiscordUser; member?: DiscordMember };

	isApplicationCommand(): this is ApplicationCommandInteraction {
		return this.data.type === InteractionTypes.ApplicationCommand;
	}

	isChatInput(): this is ApplicationCommandInteraction {
		return this.isApplicationCommand() && this.data.data.type === ApplicationCommandTypes.ChatInput;
	}

	isContextMenuUser(): this is ContextMenuUserInteraction {
		return this.isApplicationCommand() && this.data.data.type === ApplicationCommandTypes.User;
	}

	isContextMenuMessage(): this is ContextMenuMessageInteraction {
		return this.isApplicationCommand() && this.data.data.type === ApplicationCommandTypes.Message;
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

	constructor(data: DiscordInteraction, options: OptionsContext | null, client: Potocuit) {
		this.data = data;
		if (options) {
			this.options = options;
		}
		this.client = client;

		if ('target_id' in (data.data ?? {})) {
			if (this.isContextMenuUser()) {
				const user = this.data.data.resolved!.users![data.data!.target_id!];
				const member = this.data.data.resolved!.members![data.data!.target_id!];
				this.target = { user, member };
			} else if (this.isContextMenuMessage()) {
				const message = this.data.data.resolved!.messages![data.data!.target_id!];
				this.target = { message };
			}
		}
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
