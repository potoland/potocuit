import type { ComponentInteraction } from '../structures';

export abstract class ComponentCommand {
	abstract filter(interaction: ComponentInteraction): Promise<boolean> | boolean;
	abstract run(interaction: ComponentInteraction): any;
}
