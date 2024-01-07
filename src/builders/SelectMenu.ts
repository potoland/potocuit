import {
	APIChannelSelectComponent,
	APIMentionableSelectComponent,
	APIMessageComponentEmoji,
	APIRoleSelectComponent,
	APISelectMenuComponent,
	APISelectMenuDefaultValue,
	APISelectMenuOption,
	APIStringSelectComponent,
	APIUserSelectComponent,
	ChannelType,
	ComponentType,
	RestOrArray,
	SelectMenuDefaultValueType,
} from '../common';
import {
	ChannelSelectMenuInteraction,
	ComponentInteraction,
	MentionableSelectMenuInteraction,
	RoleSelectMenuInteraction,
	StringSelectMenuInteraction,
	UserSelectMenuInteraction,
} from '../structures';
import { BaseComponentBuilder, OptionValuesLength } from './Base';
import { ComponentCallback } from './types';

export type PotoSelectMenus =
	| RoleSelectMenu
	| UserSelectMenu
	| MentionableSelectMenu
	| ChannelSelectMenu
	| StringSelectMenu;

function mappedDefault<T extends SelectMenuDefaultValueType>(ids: string[], type: T) {
	return ids.map((id) => ({ id, type })) as APISelectMenuDefaultValue<T>[];
}

export class SelectMenu<
	Select extends APISelectMenuComponent = APISelectMenuComponent,
	Interaction = ComponentInteraction,
> extends BaseComponentBuilder<Select> {
	/** @internal */
	__exec?: ComponentCallback<Interaction>;

	setCustomId(id: string): this {
		this.data.custom_id = id;
		return this;
	}

	setPlaceholder(placeholder: string): this {
		this.data.placeholder = placeholder;
		return this;
	}

	setValuesLength({ max, min }: Partial<OptionValuesLength>): this {
		this.data.max_values = max;
		this.data.min_values = min;
		return this;
	}

	setDisabled(disabled = true): this {
		this.data.disabled = disabled;
		return this;
	}

	run(func: ComponentCallback<Interaction>): this {
		this.__exec = func;
		return this;
	}
}

export class UserSelectMenu extends SelectMenu<APIUserSelectComponent, UserSelectMenuInteraction> {
	constructor(data: Partial<APIUserSelectComponent> = {}) {
		super({ ...data, type: ComponentType.UserSelect });
	}

	addDefaultUsers(...users: RestOrArray<string>): this {
		this.data.default_values = (this.data.default_values ?? []).concat(
			mappedDefault(users.flat(), SelectMenuDefaultValueType.User),
		);
		return this;
	}

	setDefaultUsers(...users: RestOrArray<string>): this {
		this.data.default_values = mappedDefault(users.flat(), SelectMenuDefaultValueType.User);
		return this;
	}
}

export class RoleSelectMenu extends SelectMenu<APIRoleSelectComponent, RoleSelectMenuInteraction> {
	constructor(data: Partial<APIRoleSelectComponent> = {}) {
		super({ ...data, type: ComponentType.RoleSelect });
	}

	addDefaultRoles(...roles: RestOrArray<string>): this {
		this.data.default_values = (this.data.default_values ?? []).concat(
			mappedDefault(roles.flat(), SelectMenuDefaultValueType.Role),
		);
		return this;
	}

	setDefaultRoles(...roles: RestOrArray<string>): this {
		this.data.default_values = mappedDefault(roles.flat(), SelectMenuDefaultValueType.Role);
		return this;
	}
}

export class MentionableSelectMenu extends SelectMenu<APIMentionableSelectComponent, MentionableSelectMenuInteraction> {
	constructor(data: Partial<APIMentionableSelectComponent> = {}) {
		super({ ...data, type: ComponentType.MentionableSelect });
	}
}

export class ChannelSelectMenu extends SelectMenu<APIChannelSelectComponent, ChannelSelectMenuInteraction> {
	constructor(data: Partial<APIChannelSelectComponent> = {}) {
		super({ ...data, type: ComponentType.ChannelSelect });
	}

	addDefaultChannels(...channels: RestOrArray<string>): this {
		this.data.default_values = (this.data.default_values ?? []).concat(
			mappedDefault(channels.flat(), SelectMenuDefaultValueType.Channel),
		);
		return this;
	}

	setDefaultChannels(...channels: RestOrArray<string>): this {
		this.data.default_values = mappedDefault(channels.flat(), SelectMenuDefaultValueType.Channel);
		return this;
	}

	setChannelTypes(types: ChannelType[]): this {
		this.data.channel_types = types;
		return this;
	}
}

export class StringSelectMenu extends SelectMenu<APIStringSelectComponent, StringSelectMenuInteraction> {
	constructor(data: Partial<APIStringSelectComponent> = {}) {
		super({ ...data, type: ComponentType.StringSelect });
	}

	addOption(...options: RestOrArray<APISelectMenuOption>): this {
		this.data.options ??= [];
		this.data.options = this.data.options.concat(options.flat());
		return this;
	}

	setOptions(options: APISelectMenuOption[]): this {
		this.data.options = options;
		return this;
	}
}

export class StringSelectOption {
	constructor(public data: Partial<APISelectMenuOption> = {}) {}

	setLabel(label: string): this {
		this.data.label = label;
		return this;
	}

	setValue(value: string): this {
		this.data.value = value;
		return this;
	}

	setDescription(description: string): this {
		this.data.description = description;
		return this;
	}

	setDefault(Default = true): this {
		this.data.default = Default;
		return this;
	}

	setEmoji(emoji: APIMessageComponentEmoji): this {
		this.data.emoji = emoji;
		return this;
	}

	toJSON(): APISelectMenuOption {
		return { ...this.data } as APISelectMenuOption;
	}
}
