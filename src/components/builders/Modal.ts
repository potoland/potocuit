import { fromComponent } from '.';
import {
	APIActionRowComponent,
	APIModalInteractionResponseCallbackData,
	APITextInputComponent,
	ComponentType,
	RestOrArray,
	TextInputStyle,
} from '../../common';
import { ActionRow } from './ActionRow';
import { BaseComponentBuilder, OptionValuesLength } from './Base';
import { ModalSubmitCallback, PotoModalComponents } from './types';

export class Modal<T extends PotoModalComponents = TextInput> {
	/** @internal */
	__exec?: ModalSubmitCallback;
	components: ActionRow<T>[] = [];

	constructor(public data: Partial<APIModalInteractionResponseCallbackData> = {}) {
		this.components = this.components.concat((data.components?.map(fromComponent) as ActionRow<T>[]) ?? []);
	}

	addComponents(...components: RestOrArray<ActionRow<T>>) {
		this.components = this.components.concat(components.flat());
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
			components: this.components.map((x) => x.toJSON() as unknown as APIActionRowComponent<APITextInputComponent>),
		} as APIModalInteractionResponseCallbackData;
	}
}

export class TextInput extends BaseComponentBuilder<APITextInputComponent> {
	constructor(data: Partial<APITextInputComponent> = {}) {
		super({ ...data, type: ComponentType.TextInput });
	}

	setStyle(style: TextInputStyle): this {
		this.data.style = style;
		return this;
	}

	setLabel(label: string): this {
		this.data.label = label;
		return this;
	}

	setPlaceholder(placeholder: string): this {
		this.data.placeholder = placeholder;
		return this;
	}

	setLength({ max, min }: Partial<OptionValuesLength>): this {
		this.data.max_length = max;
		this.data.min_length = min;
		return this;
	}

	setCustomId(id: string): this {
		this.data.custom_id = id;
		return this;
	}

	setValue(value: string): this {
		this.data.value = value;
		return this;
	}

	setRequired(required = true): this {
		this.data.required = required;
		return this;
	}
}
