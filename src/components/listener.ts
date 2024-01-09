import type { ActionRow, BuilderComponents, ListenerOptions } from '../builders';

export class ComponentsListener<T extends BuilderComponents> {
	components: ActionRow<T>[] = [];
	idle?: NodeJS.Timeout;
	timeout?: NodeJS.Timeout;

	constructor(readonly options: ListenerOptions) {}

	addRow(row: ActionRow<T>) {
		this.components.push(row);
		return this;
	}
}
