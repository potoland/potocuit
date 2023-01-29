import type {
	ButtonStyles, ChannelTypes,
	InteractionResponseTypes, Locales,
	MessageComponentTypes, TextStyles
} from '@biscuitland/api-types';
import type {
	CreateMessageData
} from './message';

type InteractionResponseCallback<T, D = void> =
	D extends object
	? { type: T; data: D }
	: { type: T };

export type PongCallback
	= InteractionResponseCallback<
		InteractionResponseTypes.Pong
	>;

export type ChannelMessageWithSourceCallback
	= InteractionResponseCallback<
		InteractionResponseTypes.ChannelMessageWithSource,
		CreateMessageData
	>;

export type DeferredChannelMessageWithSourceCallback
	= InteractionResponseCallback<InteractionResponseTypes.DeferredChannelMessageWithSource>;

export type DeferredUpdateMessageCallback
	= InteractionResponseCallback<InteractionResponseTypes.DeferredUpdateMessage>;

export type UpdateMessageCallback
	= InteractionResponseCallback<
		InteractionResponseTypes.UpdateMessage,
		CreateMessageData
	>;

interface AutocompleteChoice {
	name: string;
	value: string | number;
	name_localizations?: Partial<Record<Locales, string>>;
}

export type ApplicationCommandAutocompleteResultCallback
	= InteractionResponseCallback<
		InteractionResponseTypes.ApplicationCommandAutocompleteResult,
		{
			choices: AutocompleteChoice[];
		}
	>;

export type ModalCallback
	= InteractionResponseCallback<
		InteractionResponseTypes.Modal
	>;

export interface ActionRowComponent {
	type: MessageComponentTypes.ActionRow;
	components: (SelectMenuComponent | ButtonComponent | InputTextComponent)[];
}

interface PartialEmoji {
	name: string;
	id?: string;
}

type Component<T = ButtonStyles, K extends keyof Component = never> = Omit<{
	type: MessageComponentTypes.Button;
	style: T;
	// label?: string;
	// emoji?: PartialEmoji;
	custom_id: string;
	url: string;
	disabled?: boolean;
}, K> & ({ emoji: PartialEmoji } | { label: string } | { emoji: PartialEmoji; label: string });

type ComponentLink = Component<
	ButtonStyles.Link,
	'custom_id'
>;

type ComponentPrimary = Component<
	ButtonStyles.Primary,
	'url'
>;

type ComponentSecondary = Component<
	ButtonStyles.Secondary,
	'url'
>;

type ComponentSuccess = Component<
	ButtonStyles.Success,
	'url'
>;

type ComponentDanger = Component<
	ButtonStyles.Danger,
	'url'
>;

export type ButtonComponent =
	ComponentLink |
	ComponentPrimary |
	ComponentSecondary |
	ComponentSuccess |
	ComponentDanger;

interface InputTextComponent {
	type: MessageComponentTypes.InputText;
	custom_id: string;
	style: TextStyles;
	label: string;
	min_length?: number;
	max_length?: number;
	required?: boolean;
	value?: string;
	placeholder?: string;
}

interface SelectOption {
	label: string;
	value: string;
	description?: string;
	emoji?: PartialEmoji;
	default?: boolean;
}

interface SelectMenuBase {
	custom_id: string;
	options?: SelectOption[];
	channel_types?: ChannelTypes[];
	placeholder?: string;
	min_values?: number;
	max_values?: number;
	disabled?: boolean;
}

type SelectMenu<T =
	MessageComponentTypes.SelectMenu |
	MessageComponentTypes.UserSelect |
	MessageComponentTypes.RoleSelect |
	MessageComponentTypes.MentionableSelect |
	MessageComponentTypes.ChannelSelect,
	K extends keyof SelectMenuBase = never,
	R extends keyof SelectMenuBase = never,
> = Omit<{ type: T } & SelectMenuBase, K> & Required<Pick<SelectMenuBase, R>>;

type ComponentChannelSelectMenu = SelectMenu<MessageComponentTypes.ChannelSelect, 'options'>;
type ComponentSelectMenu = SelectMenu<MessageComponentTypes.SelectMenu, 'channel_types', 'options'>;
type ComponentUserSelect = SelectMenu<MessageComponentTypes.UserSelect, 'channel_types' | 'options'>;
type ComponentRoleSelect = SelectMenu<MessageComponentTypes.RoleSelect, 'channel_types' | 'options'>;
type ComponentMentionableSelect = SelectMenu<MessageComponentTypes.MentionableSelect, 'channel_types' | 'options'>;

export type SelectMenuComponent =
	ComponentChannelSelectMenu |
	ComponentSelectMenu |
	ComponentUserSelect |
	ComponentRoleSelect |
	ComponentMentionableSelect;

// export interface UserSelectComponent {
// 	type: MessageComponentTypes.UserSelect;
// }

// export interface RoleSelectComponent {
// 	type: MessageComponentTypes.RoleSelect;
// }

// export interface MentionableSelectComponent {
// 	type: MessageComponentTypes.MentionableSelect;
// }

// export interface ChannelSelectComponent {
// 	type: MessageComponentTypes.ChannelSelect;
// }

