import type { ComponentInteraction, ModalSubmitInteraction } from "../structures";

export const InteractionCommandType = {
	COMPONENT: 0,
	MODAL: 1,
} as const;

export abstract class ComponentCommand {
	type = InteractionCommandType.COMPONENT;
	abstract filter(interaction: ComponentInteraction): Promise<boolean> | boolean;
	abstract run(interaction: ComponentInteraction): any;
}

export abstract class ModalCommand {
	type = InteractionCommandType.MODAL;
	abstract filter(interaction: ModalSubmitInteraction): Promise<boolean> | boolean;
	abstract run(interaction: ModalSubmitInteraction): any;
}
