import { fromComponent } from '.';
import {
	ComponentType,
	fastFlat,
	type APIActionRowComponent,
	type APIActionRowComponentTypes,
	type APIMessageActionRowComponent,
	type RestOrArray,
} from '../common';
import { BaseComponentBuilder } from './Base';
import type { BuilderComponents, FixedComponents } from './types';

export class ActionRow<T extends BuilderComponents> extends BaseComponentBuilder<
	APIActionRowComponent<APIActionRowComponentTypes>
> {
	constructor({ components, ...data }: Partial<APIActionRowComponent<APIActionRowComponentTypes>> = {}) {
		super({ ...data, type: ComponentType.ActionRow });
		this.components = (components?.map(fromComponent) ?? []) as FixedComponents<T>[];
	}

	components: FixedComponents<T>[];

	addComponents(...component: RestOrArray<FixedComponents<T>>): this {
		this.components = this.components.concat(fastFlat(component) as FixedComponents<T>[]);
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
