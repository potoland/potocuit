import type { APIMessageActionRowComponent, ComponentType } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { BiscuitActionRowMessageComponents } from '.';
import { componentFactory } from '.';
import { BaseComponent } from '../structures/extra/BaseComponent';

export class MessageActionRowComponent<
	T extends BiscuitActionRowMessageComponents,
> extends BaseComponent<ComponentType.ActionRow> {
	constructor(
		readonly rest: BiscuitREST,
		data: {
			type: ComponentType.ActionRow;
			components: APIMessageActionRowComponent[];
		},
	) {
		super(data);
		this.components = data.components.map(componentFactory) as T[];
	}

	components: T[];
}
