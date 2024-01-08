import { fromComponent } from '.';
import {
	type APIActionRowComponent,
	type APIActionRowComponentTypes,
	type APIMessageActionRowComponent,
	ComponentType,
	type RestOrArray,
} from '../common';
import { BaseComponentBuilder } from './Base';
import type { FixedComponents, PotoComponents } from './types';

export class ActionRow<T extends PotoComponents> extends BaseComponentBuilder<
	APIActionRowComponent<APIActionRowComponentTypes>
> {
	constructor({ components, ...data }: Partial<APIActionRowComponent<APIActionRowComponentTypes>> = {}) {
		super({ ...data, type: ComponentType.ActionRow });
		this.components = (components?.map(fromComponent) ?? []) as FixedComponents<T>[];
	}

	components: FixedComponents<T>[];

	addComponents(...component: RestOrArray<FixedComponents<T>>): this {
		this.components = this.components.concat(component.flat() as FixedComponents<T>[]);
		return this;
	}

	setComponents(component: FixedComponents<T>[]): this {
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
