import { APIBaseComponent, ComponentType } from '../../common';

export abstract class BaseComponentBuilder<
	TYPE extends Partial<APIBaseComponent<ComponentType>> = APIBaseComponent<ComponentType>,
> {
	constructor(public data: Partial<TYPE>) { }

	toJSON(): TYPE {
		return { ...this.data } as TYPE;
	}
}

export type OptionValuesLength = { max: number; min: number };
