import type { APIMessageActionRowComponent, ComponentType } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { BaseComponent } from '../extra/BaseComponent';
import type { BiscuitActionRowMessageComponents } from './mod';
import { componentFactory } from './mod';

export class MessageActionRowComponent<
	T extends BiscuitActionRowMessageComponents,
> extends BaseComponent<ComponentType.ActionRow> {
	constructor(
		readonly rest: BiscuitREST,
		data: {
			type: ComponentType.ActionRow;
			components: APIMessageActionRowComponent[];
		}
	) {
		super(data);
		this.components = data.components.map(component => componentFactory(component)) as T[];
	}

	components: T[];
}
