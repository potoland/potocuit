import { ComponentInteraction, ModalSubmitInteraction } from "../../structures/Interaction";
import { Button } from "./Button";
import { TextInput } from "./Modal";
import { PotoSelectMenus } from "./SelectMenu";

export type ComponentCallback<T = ComponentInteraction> = (interaction: T, stop: () => void) => any;
export type ModalSubmitCallback<T = ModalSubmitInteraction> = (interaction: T) => any;
export type ButtonLink = Omit<Button, 'setCustomId'>;
export type ButtonID = Omit<Button, 'setURL'>;

export type PotoMessageComponents = FixedComponents<Button> | PotoSelectMenus;
export type PotoModalComponents = TextInput;
export type PotoComponents = PotoMessageComponents | TextInput;
export type FixedComponents<T = Button> = T extends Button ? ButtonLink | ButtonID : T;
