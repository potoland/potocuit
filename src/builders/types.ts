import type { ComponentInteraction, ModalSubmitInteraction } from '../structures/Interaction';
import type { Button } from './Button';
import type { TextInput } from './Modal';
import type { PotoSelectMenus } from './SelectMenu';

export type ComponentCallback<T = ComponentInteraction> = (
	interaction: T,
	stop: ComponentStopCallback,
	refresh: ComponentRefreshCallback,
) => any;
export type ComponentFilterCallback<T = ComponentInteraction> = (interaction: T) => any;
export type ComponentStopCallback = (reason?: string, refresh?: ComponentRefreshCallback) => any;
export type ComponentRefreshCallback = () => any;
export type ModalSubmitCallback<T = ModalSubmitInteraction> = (interaction: T) => any;
export type ButtonLink = Omit<Button, 'setCustomId'>;
export type ButtonID = Omit<Button, 'setURL'>;

export type PotoMessageComponents = FixedComponents<Button> | PotoSelectMenus;
export type PotoModalComponents = TextInput;
export type PotoComponents = PotoMessageComponents | TextInput;
export type FixedComponents<T = Button> = T extends Button ? ButtonLink | ButtonID : T;
export interface ListenerOptions {
	timeout?: number;
	idle?: number;
	filter?: ComponentFilterCallback;
	onStop?: ComponentStopCallback;
}
