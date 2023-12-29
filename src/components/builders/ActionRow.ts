import {
	APIActionRowComponent,
	APIActionRowComponentTypes,
	APIMessageActionRowComponent,
	ComponentType,
	TypeArray,
} from '@biscuitland/common';
import { BaseComponent, FixedComponents, PotoComponents } from '.';
import { createComponent } from '..';

export class ActionRow<T extends PotoComponents> extends BaseComponent<
	APIActionRowComponent<APIActionRowComponentTypes>
> {
	constructor({ components, ...data }: Partial<APIActionRowComponent<APIActionRowComponentTypes>> = {}) {
		super({ ...data, type: ComponentType.ActionRow });
		this.components = (components?.map(createComponent) ?? []) as FixedComponents<T>[];
	}

	components: FixedComponents<T>[];

	addComponents(component: TypeArray<FixedComponents<T>>): this {
		this.components = this.components.concat(component);
		return this;
	}

	setComponents(component: FixedComponents<T>[]): this {
		this.components = [...component];
		return this;
	}

	toJSON(): APIActionRowComponent<APIMessageActionRowComponent> {
		const components = this.components.map((c) => {
			return c.toJSON();
		}) as APIMessageActionRowComponent[];
		return { type: ComponentType.ActionRow, components };
	}
}
