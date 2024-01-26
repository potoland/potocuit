import {
	ComponentType,
	SelectMenuDefaultValueType,
	fastFlat,
	fastMap,
	type APIChannelSelectComponent,
	type APIMentionableSelectComponent,
	type APIMessageComponentEmoji,
	type APIRoleSelectComponent,
	type APISelectMenuComponent,
	type APISelectMenuDefaultValue,
	type APISelectMenuOption,
	type APIStringSelectComponent,
	type APIUserSelectComponent,
	type ChannelType,
	type RestOrArray,
} from '../common';
import type {
	ChannelSelectMenuInteraction,
	ComponentInteraction,
	MentionableSelectMenuInteraction,
	RoleSelectMenuInteraction,
	StringSelectMenuInteraction,
	UserSelectMenuInteraction,
} from '../structures';
import { BaseComponentBuilder, type OptionValuesLength } from './Base';
import type { ComponentCallback } from './types';

export type BuilderSelectMenus =
	| RoleSelectMenu
	| UserSelectMenu
	| MentionableSelectMenu
	| ChannelSelectMenu
	| StringSelectMenu;

/**
 * Maps default values for Select Menus.
 * @template T - The type of SelectMenuDefaultValueType.
 * @param ids - The IDs of items to be mapped as default.
 * @param type - The type of default values.
 * @returns An array of default values.
 */
function mappedDefault<T extends SelectMenuDefaultValueType>(
	ids: RestOrArray<string>,
	type: T,
): APISelectMenuDefaultValue<T>[] {
	return fastMap(fastFlat(ids), id => ({ id, type }));
}

/**
 * Represents a base class for building Select Menus.
 * @template Select - The type of APISelectMenuComponent.
 * @template Interaction - The type of interaction.
 * @example
 * const selectMenu = new SelectMenu<APIUserSelectComponent, UserSelectMenuInteraction>();
 * selectMenu.setCustomId("user-select-menu");
 * selectMenu.setPlaceholder("Select a user");
 * selectMenu.run((interaction) => {
 *   // Handle select menu interaction
 * });
 */
export class SelectMenu<
	Select extends APISelectMenuComponent = APISelectMenuComponent,
	Interaction = ComponentInteraction,
> extends BaseComponentBuilder<Select> {
	/** @internal */
	__exec?: ComponentCallback<Interaction>;

	/**
	 * Sets the custom ID for the select menu.
	 * @param id - The custom ID for the select menu.
	 * @returns The current SelectMenu instance.
	 */
	setCustomId(id: string): this {
		this.data.custom_id = id;
		return this;
	}

	/**
	 * Sets the placeholder text for the select menu.
	 * @param placeholder - The placeholder text.
	 * @returns The current SelectMenu instance.
	 */
	setPlaceholder(placeholder: string): this {
		this.data.placeholder = placeholder;
		return this;
	}

	/**
	 * Sets the maximum and minimum number of selected values for the select menu.
	 * @param options - The maximum and minimum values.
	 * @returns The current SelectMenu instance.
	 */
	setValuesLength({ max, min }: Partial<OptionValuesLength>): this {
		this.data.max_values = max;
		this.data.min_values = min;
		return this;
	}

	/**
	 * Sets whether the select menu is disabled.
	 *  [disabled=true] - Indicates whether the select menu is disabled.
	 * @returns The current SelectMenu instance.
	 */
	setDisabled(disabled = true): this {
		this.data.disabled = disabled;
		return this;
	}

	/**
	 * Sets the callback function to be executed when the select menu is interacted with.
	 *  func - The callback function.
	 * @returns The current SelectMenu instance.
	 */
	run(func: ComponentCallback<Interaction>): this {
		this.__exec = func;
		return this;
	}
}

/**
 * Represents a Select Menu for selecting users.
 * @example
 * const userSelectMenu = new UserSelectMenu();
 * userSelectMenu.setCustomId("user-select");
 * userSelectMenu.addDefaultUsers("123456789", "987654321");
 */
export class UserSelectMenu extends SelectMenu<APIUserSelectComponent, UserSelectMenuInteraction> {
	constructor(data: Partial<APIUserSelectComponent> = {}) {
		super({ ...data, type: ComponentType.UserSelect });
	}

	/**
	 * Adds default selected users to the select menu.
	 * @param users - User IDs to be added as default.
	 * @returns The current UserSelectMenu instance.
	 */
	addDefaultUsers(...users: RestOrArray<string>): this {
		this.data.default_values = (this.data.default_values ?? []).concat(
			mappedDefault(users, SelectMenuDefaultValueType.User),
		);
		return this;
	}

	/**
	 * Sets the default selected users for the select menu.
	 * @param users - User IDs to be set as default.
	 * @returns The current UserSelectMenu instance.
	 */
	setDefaultUsers(...users: RestOrArray<string>): this {
		this.data.default_values = mappedDefault(users, SelectMenuDefaultValueType.User);
		return this;
	}
}

/**
 * Represents a Select Menu for selecting roles.
 * @example
 * const roleSelectMenu = new RoleSelectMenu();
 * roleSelectMenu.setCustomId("role-select");
 * roleSelectMenu.addDefaultRoles("123456789", "987654321");
 */
export class RoleSelectMenu extends SelectMenu<APIRoleSelectComponent, RoleSelectMenuInteraction> {
	constructor(data: Partial<APIRoleSelectComponent> = {}) {
		super({ ...data, type: ComponentType.RoleSelect });
	}

	/**
	 * Adds default selected roles to the select menu.
	 * @param roles - Role IDs to be added as default.
	 * @returns The current RoleSelectMenu instance.
	 */
	addDefaultRoles(...roles: RestOrArray<string>): this {
		this.data.default_values = (this.data.default_values ?? []).concat(
			mappedDefault(roles, SelectMenuDefaultValueType.Role),
		);
		return this;
	}

	/**
	 * Sets the default selected roles for the select menu.
	 * @param roles - Role IDs to be set as default.
	 * @returns The current RoleSelectMenu instance.
	 */
	setDefaultRoles(...roles: RestOrArray<string>): this {
		this.data.default_values = mappedDefault(roles, SelectMenuDefaultValueType.Role);
		return this;
	}
}

/**
 * Represents a Select Menu for selecting mentionable entities.
 * @example
 * const mentionableSelectMenu = new MentionableSelectMenu();
 * mentionableSelectMenu.setCustomId("mentionable-select");
 */
export class MentionableSelectMenu extends SelectMenu<APIMentionableSelectComponent, MentionableSelectMenuInteraction> {
	constructor(data: Partial<APIMentionableSelectComponent> = {}) {
		super({ ...data, type: ComponentType.MentionableSelect });
	}
}

/**
 * Represents a Select Menu for selecting channels.
 * @example
 * const channelSelectMenu = new ChannelSelectMenu();
 * channelSelectMenu.setCustomId("channel-select");
 * channelSelectMenu.addDefaultChannels("123456789", "987654321");
 * channelSelectMenu.setChannelTypes([ChannelType.GuildText, ChannelType.GuildVoice]);
 */
export class ChannelSelectMenu extends SelectMenu<APIChannelSelectComponent, ChannelSelectMenuInteraction> {
	constructor(data: Partial<APIChannelSelectComponent> = {}) {
		super({ ...data, type: ComponentType.ChannelSelect });
	}

	/**
	 * Adds default selected channels to the select menu.
	 * @param channels - Channel IDs to be added as default.
	 * @returns The current ChannelSelectMenu instance.
	 */
	addDefaultChannels(...channels: RestOrArray<string>): this {
		this.data.default_values = (this.data.default_values ?? []).concat(
			mappedDefault(channels, SelectMenuDefaultValueType.Channel),
		);
		return this;
	}

	/**
	 * Sets the default selected channels for the select menu.
	 * @param channels - Channel IDs to be set as default.
	 * @returns The current ChannelSelectMenu instance.
	 */
	setDefaultChannels(...channels: RestOrArray<string>): this {
		this.data.default_values = mappedDefault(channels, SelectMenuDefaultValueType.Channel);
		return this;
	}

	/**
	 * Sets the types of channels that can be selected in the menu.
	 *  types - The types of channels.
	 * @returns The current ChannelSelectMenu instance.
	 */
	setChannelTypes(types: ChannelType[]): this {
		this.data.channel_types = types;
		return this;
	}
}

/**
 * Represents a Select Menu for selecting string options.
 * @example
 * const stringSelectMenu = new StringSelectMenu();
 * stringSelectMenu.setCustomId("string-select");
 * stringSelectMenu.addOption(new StringSelectOption().setLabel("Option 1").setValue("option_1"));
 * stringSelectMenu.setOptions([
 *   { label: "Option 2", value: "option_2" },
 *   { label: "Option 3", value: "option_3" },
 * ]);
 */
export class StringSelectMenu extends SelectMenu<APIStringSelectComponent, StringSelectMenuInteraction> {
	constructor(data: Partial<APIStringSelectComponent> = {}) {
		super({ ...data, type: ComponentType.StringSelect });
	}

	/**
	 * Adds options to the string select menu.
	 * @param {...RestOrArray<APISelectMenuOption>} options - Options to be added.
	 * @returns The current StringSelectMenu instance.
	 */
	addOption(...options: RestOrArray<APISelectMenuOption>): this {
		this.data.options ??= [];
		this.data.options = this.data.options.concat(fastFlat(options));
		return this;
	}

	/**
	 * Sets the options for the string select menu.
	 *  options - Options to be set.
	 * @returns The current StringSelectMenu instance.
	 */
	setOptions(options: APISelectMenuOption[]): this {
		this.data.options = options;
		return this;
	}
}

/**
 * Represents an individual option for a string select menu.
 * @example
 * const option = new StringSelectOption().setLabel("Option 1").setValue("option_1");
 */
export class StringSelectOption {
	constructor(public data: Partial<APISelectMenuOption> = {}) {}

	/**
	 * Sets the label for the option.
	 *  label - The label for the option.
	 * @returns The current StringSelectOption instance.
	 */
	setLabel(label: string): this {
		this.data.label = label;
		return this;
	}

	/**
	 * Sets the value for the option.
	 *  value - The value for the option.
	 * @returns The current StringSelectOption instance.
	 */
	setValue(value: string): this {
		this.data.value = value;
		return this;
	}

	/**
	 * Sets the description for the option.
	 *  description - The description for the option.
	 * @returns The current StringSelectOption instance.
	 */
	setDescription(description: string): this {
		this.data.description = description;
		return this;
	}

	/**
	 * Sets whether the option is the default.
	 *  [Default=true] - Indicates whether the option is the default.
	 * @returns The current StringSelectOption instance.
	 */
	setDefault(Default = true): this {
		this.data.default = Default;
		return this;
	}

	/**
	 * Sets the emoji for the option.
	 *  emoji - The emoji for the option.
	 * @returns The current StringSelectOption instance.
	 */
	setEmoji(emoji: APIMessageComponentEmoji): this {
		this.data.emoji = emoji;
		return this;
	}

	/**
	 * Converts the option to JSON format.
	 * @returns The option data in JSON format.
	 */
	toJSON(): APISelectMenuOption {
		return { ...this.data } as APISelectMenuOption;
	}
}
