import type {
	APIMessageActionRowComponent
} from '../common';
import { ButtonStyle, ComponentType } from '../common';
import { BaseComponent } from '../structures/extra/BaseComponent';
import { ButtonComponent, LinkButtonComponent } from './ButtonComponent';
import { ChannelSelectMenuComponent } from './ChannelSelectMenuComponent';
import { MentionableSelectMenuComponent } from './MentionableSelectMenuComponent';
import { RoleSelectMenuComponent } from './RoleSelectMenuComponent';
import { StringSelectMenuComponent } from './StringSelectMenuComponent';
import type { TextInputComponent } from './TextInputComponent';
import { UserSelectMenuComponent } from './UserSelectMenuComponent';

export * from './builders';

export type BiscuitComponents =
	| ButtonComponent
	| LinkButtonComponent
	| RoleSelectMenuComponent
	| UserSelectMenuComponent
	| StringSelectMenuComponent
	| ChannelSelectMenuComponent
	| MentionableSelectMenuComponent
	| TextInputComponent;

export type BiscuitActionRowMessageComponents = Exclude<BiscuitComponents, TextInputComponent>;

export * from './builders';
export * from './command';

/**
 * Return a new component instance based on the component type.
 *
 * @param component The component to create.
 * @returns The component instance.
 */
export function componentFactory(
	component: APIMessageActionRowComponent,
): BiscuitActionRowMessageComponents | BaseComponent<BiscuitActionRowMessageComponents['type']> {
	switch (component.type) {
		case ComponentType.Button:
			if (component.style === ButtonStyle.Link) {
				return new LinkButtonComponent(component);
			}
			return new ButtonComponent(component);
		case ComponentType.ChannelSelect:
			return new ChannelSelectMenuComponent(component);
		case ComponentType.RoleSelect:
			return new RoleSelectMenuComponent(component);
		case ComponentType.StringSelect:
			return new StringSelectMenuComponent(component);
		case ComponentType.UserSelect:
			return new UserSelectMenuComponent(component);
		case ComponentType.MentionableSelect:
			return new MentionableSelectMenuComponent(component);
		default:
			return new BaseComponent<BiscuitActionRowMessageComponents['type']>(component);
	}
}
