import type { BiscuitActionRowMessageComponents } from '.';
import { componentFactory } from '.';
import type { APIMessageActionRowComponent, ComponentType } from '../common';
import { BaseComponent } from '../structures/extra/BaseComponent';

export class MessageActionRowComponent<
	T extends BiscuitActionRowMessageComponents,
> extends BaseComponent<ComponentType.ActionRow> {
	constructor(data: {
		type: ComponentType.ActionRow;
		components: APIMessageActionRowComponent[];
	}) {
		super(data);
		this.components = data.components.map(componentFactory) as T[];
	}

	components: T[];
}
