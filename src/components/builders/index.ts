import type { ButtonStylesForID } from '@biscuitland/helpers';
import { ModalTextInput, UserSelectMenu as USM, RoleSelectMenu as RSM, MentionableSelectMenu as MSM, ChannelSelectMenu as CSM, StringSelectMenu as SSM, BaseComponent } from '@biscuitland/helpers';
import type { ButtonInteraction, ChannelSelectMenuInteraction, ComponentInteraction, MentionableSelectMenuInteraction, ModalSubmitInteraction, RoleSelectMenuInteraction, StringSelectMenuInteraction, UserSelectMenuInteraction } from '../../structures';
import { ComponentType, type APIButtonComponentWithCustomId, type When, type TypeArray } from '@biscuitland/common';
import type { APIActionRowComponent, APIActionRowComponentTypes, APIButtonComponent, APIButtonComponentWithURL, APIMessageActionRowComponent, APIMessageComponentEmoji, APIModalInteractionResponseCallbackData, APITextInputComponent, ButtonStyle } from '@biscuitland/common';
export type ComponentCallback<T = ComponentInteraction> = (interaction: T) => any;
export type ModalSubmitCallback<T = ModalSubmitInteraction> = (interaction: T) => any;

export class Button<Type extends boolean = boolean> {
	/** @internal */
	__exec?: ComponentCallback<ButtonInteraction>;

	constructor(public data: Partial<When<Type, APIButtonComponentWithCustomId, APIButtonComponentWithURL>> = {}) {
		this.data.type = ComponentType.Button;
	}

	setCustomId(id: string): Omit<this, 'setURL'> {
		// @ts-expect-error
		this.data.custom_id = id;
		return this;
	}

	setURL(url: string): Omit<this, 'setCustomId'> {
		// @ts-expect-error
		this.data.url = url;
		return this;
	}

	setLabel(label: string) {
		this.data.label = label;
		return this;
	}

	setEmoji(emoji: APIMessageComponentEmoji) {
		this.data.emoji = emoji;
		return this;
	}

	setDisabled(disabled = true) {
		this.data.disabled = disabled;
		return this;
	}

	setStyle(style: ButtonStyle.Link): Omit<this, 'setCustomId'>;
	setStyle(style: ButtonStylesForID): Omit<this, 'setURL'>;
	setStyle(style: ButtonStyle): Omit<this, 'setURL'> | Omit<this, 'setCustomId'> {
		this.data.style = style;
		return this as any;
	}

	run(func: ComponentCallback<ButtonInteraction>): this {
		this.__exec = func;
		return this;
	}

	toJSON() {
		return { ...this.data } as unknown as APIButtonComponent;
	}
}

export class TextInput extends ModalTextInput { }

export class UserSelectMenu extends USM {
	/** @internal */
	__exec?: ComponentCallback<UserSelectMenuInteraction>;

	run(func: ComponentCallback<UserSelectMenuInteraction>): this {
		this.__exec = func;
		return this;
	}
}

export class RoleSelectMenu extends RSM {
	/** @internal */
	__exec?: ComponentCallback<RoleSelectMenuInteraction>;

	run(func: ComponentCallback<RoleSelectMenuInteraction>): this {
		this.__exec = func;
		return this;
	}
}

export class MentionableSelectMenu extends MSM {
	/** @internal */
	__exec?: ComponentCallback<MentionableSelectMenuInteraction>;

	run(func: ComponentCallback<MentionableSelectMenuInteraction>): this {
		this.__exec = func;
		return this;
	}
}

export class ChannelSelectMenu extends CSM {
	/** @internal */
	__exec?: ComponentCallback<ChannelSelectMenuInteraction>;

	run(func: ComponentCallback<ChannelSelectMenuInteraction>): this {
		this.__exec = func;
		return this;
	}
}

export class StringSelectMenu extends SSM {
	/** @internal */
	__exec?: ComponentCallback<StringSelectMenuInteraction>;

	run(func: ComponentCallback<StringSelectMenuInteraction>): this {
		this.__exec = func;
		return this;
	}
}

export type PotoSelectMenus = RoleSelectMenu | UserSelectMenu | MentionableSelectMenu | ChannelSelectMenu | StringSelectMenu;
export type PotoMessageComponents = Button | PotoSelectMenus;
export type PotoModalComponents = TextInput;
export type PotoComponents = PotoMessageComponents | TextInput;

export class ActionRow<T extends PotoComponents> extends BaseComponent<APIActionRowComponent<APIActionRowComponentTypes>> {
	constructor({ components, ...data }: Partial<APIActionRowComponent<APIActionRowComponentTypes>> = {}) {
		super({ ...data, type: ComponentType.ActionRow });
		this.components = (components?.map(createComponent) ?? []) as T[];
	}

	components: T[];

	addComponents(component: TypeArray<T>): this {
		this.components = this.components.concat(component);
		return this;
	}

	setComponents(component: T[]): this {
		this.components = [...component];
		return this;
	}

	toJSON(): APIActionRowComponent<APIMessageActionRowComponent> {
		const components = this.components.map(c => {
			return c.toJSON();
		}) as APIMessageActionRowComponent[];
		return { type: ComponentType.ActionRow, components };
	}
}

export class Modal<T extends PotoModalComponents = TextInput> {
	/** @internal */
	__exec?: ModalSubmitCallback;
	components: ActionRow<T>[] = [];

	constructor(public data: Partial<APIModalInteractionResponseCallbackData> = {}) {
		this.components = this.components.concat(data.components?.map(createComponent) as ActionRow<T>[] ?? []);
	}

	addComponents(component: ActionRow<T>) {
		this.components = this.components.concat(component);
		return this;
	}

	setTitle(title: string) {
		this.data.title = title;
		return this;
	}

	setCustomId(id: string) {
		this.data.custom_id = id;
		return this;
	}

	run(func: ModalSubmitCallback): this {
		this.__exec = func;
		return this;
	}

	toJSON() {
		return {
			custom_id: this.data.custom_id,
			title: this.data.title,
			components: this.components.map(x => x.toJSON() as unknown as APIActionRowComponent<APITextInputComponent>)
		} as APIModalInteractionResponseCallbackData;
	}
}

export function createComponent(data: PotoComponents | APIActionRowComponentTypes | APIActionRowComponent<APIActionRowComponentTypes> | ActionRow<PotoComponents>): PotoComponents | ActionRow<PotoComponents> {
	if ('toJSON' in data) {
		return data;
	}

	switch (data.type) {
		case ComponentType.Button:
			return new Button(data);
		case ComponentType.StringSelect:
			return new StringSelectMenu(data);
		case ComponentType.TextInput:
			return new TextInput(data);
		case ComponentType.UserSelect:
			return new UserSelectMenu(data);
		case ComponentType.RoleSelect:
			return new RoleSelectMenu(data);
		case ComponentType.MentionableSelect:
			return new MentionableSelectMenu(data);
		case ComponentType.ChannelSelect:
			return new ChannelSelectMenu(data);
		case ComponentType.ActionRow:
			return new ActionRow(data);
	}
}
