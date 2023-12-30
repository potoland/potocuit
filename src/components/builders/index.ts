import { APIActionRowComponent, APIActionRowComponentTypes, ComponentType } from 'discord-api-types/v10';
import { ActionRow } from './ActionRow';
import { Button } from './Button';
import { TextInput } from './Modal';
import {
	ChannelSelectMenu,
	MentionableSelectMenu,
	RoleSelectMenu,
	StringSelectMenu,
	UserSelectMenu,
} from './SelectMenu';
import { PotoComponents } from './types';

export * from './ActionRow';
export * from './Base';
export * from './Button';
export * from './MessageEmbed';
export * from './Modal';
export * from './SelectMenu';
export * from './types';

export function fromComponent(
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
