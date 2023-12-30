import { PotoComponents } from '.';
import { APIActionRowComponent, APIActionRowComponentTypes, APIBaseComponent, ComponentType } from '../../common';
import { ActionRow } from './ActionRow';
import { Button } from './Button';
import { TextInput } from './Modal';
import { ChannelSelectMenu, MentionableSelectMenu, RoleSelectMenu, StringSelectMenu, UserSelectMenu } from './SelectMenu';

export abstract class BaseComponentBuilder<
	TYPE extends Partial<APIBaseComponent<ComponentType>> = APIBaseComponent<ComponentType>,
> {
	constructor(public data: Partial<TYPE>) { }

	toJSON(): TYPE {
		return { ...this.data } as TYPE;
	}

	static from(
		data:
			| PotoComponents
			| APIActionRowComponentTypes
			| APIActionRowComponent<APIActionRowComponentTypes>
			| ActionRow<PotoComponents>,
	): PotoComponents | ActionRow<PotoComponents> {
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
}

export type OptionValuesLength = { max: number; min: number };
