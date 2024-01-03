import {
	APIActionRowComponent,
	APIMessage,
	APIMessageActionRowComponent,
	APIModalInteractionResponseCallbackData,
	InteractionResponseType,
	LimitedCollection,
} from '..';
import type { ActionRow } from '../builders';
import { ComponentCallback, ModalSubmitCallback, PotoComponents } from '../builders/types';
import type { BaseClient } from '../client/base';
import { Logger, PotoHandler } from '../common';
import type {
	InteractionMessageUpdateBodyRequest,
	MessageCreateBodyRequest,
	MessageUpdateBodyRequest,
	ModalCreateBodyRequest,
} from '../common/types/write';
import type { ComponentInteraction, ModalSubmitInteraction, ReplyInteractionBody } from '../structures';
import type { ModalCommand } from './command';
import { ComponentCommand, InteractionCommandType } from './command';

export class ComponentHandler extends PotoHandler {
	readonly values = new Map<string, Partial<Record<string, ComponentCallback>>>();
	// 10 minutes timeout, because discord dont send an event when the user cancel the modal
	readonly modals = new LimitedCollection<string, ModalSubmitCallback>({ expire: 60e3 * 10 });
	readonly commands: (ComponentCommand | ModalCommand)[] = [];
	protected filter = (path: string) => path.endsWith('.js');

	constructor(logger: Logger, protected client: BaseClient) {
		super(logger);
	}

	hasComponent(id: string, customId: string) {
		return !!this.values.get(id)?.[customId];
	}

	onComponent(id: string, interaction: ComponentInteraction) {
		return this.values.get(id)?.[interaction.customId]?.(interaction, () => {
			this.values.delete(id);
		});
	}

	hasModal(interaction: ModalSubmitInteraction) {
		return this.modals.has(interaction.user.id);
	}

	onModalSubmit(interaction: ModalSubmitInteraction) {
		setImmediate(() => this.modals.delete(interaction.user.id));
		return this.modals.get(interaction.user.id)?.(interaction);
	}

	__setComponents(
		id: string,
		record: ActionRow<PotoComponents>[] | APIActionRowComponent<APIMessageActionRowComponent>[],
	) {
		const components: Record<string, ComponentCallback> = {};

		for (const actionRow of record) {
			for (const child of actionRow.components) {
				if ('data' in child && 'custom_id' in child.data && '__exec' in child) {
					components[child.data.custom_id!] = child.__exec as ComponentCallback;
				}
			}
		}

		if (Object.entries(components).length) {
			this.values.set(id, components);
		}
	}

	protected __setModal(id: string, record: APIModalInteractionResponseCallbackData | ModalCreateBodyRequest) {
		if ('__exec' in record) {
			this.modals.set(id, record.__exec!);
		}
	}

	onRequestInteraction(interactionId: string, interaction: ReplyInteractionBody) {
		// @ts-expect-error
		if (!interaction.data) {
			return;
		}
		switch (interaction.type) {
			case InteractionResponseType.ChannelMessageWithSource:
			case InteractionResponseType.UpdateMessage:
				if (!interaction.data.components?.length) {
					return;
				}
				this.__setComponents(interactionId, interaction.data.components ?? []);
				break;
			case InteractionResponseType.Modal:
				this.__setModal(interactionId, interaction.data);
				break;
		}
	}

	onMessageDelete(id: string) {
		this.values.delete(id);
	}

	onRequestInteractionUpdate(body: InteractionMessageUpdateBodyRequest, message: APIMessage) {
		if (!body.components?.length) {
			return;
		}
		if (message.interaction?.id) {
			this.values.delete(message.interaction.id);
		}
		this.__setComponents(message.id, body.components);
	}

	onRequestMessage(body: MessageCreateBodyRequest, message: APIMessage) {
		if (!body.components?.length) {
			return;
		}
		this.__setComponents(message.id, body.components);
	}

	onRequestUpdateMessage(body: MessageUpdateBodyRequest, message: APIMessage) {
		if (!body.components) return;
		this.values.delete(message.id);
		this.__setComponents(message.id, body.components);
	}

	async load(commandsDir: string) {
		for (const i of (await this.loadFiles<ComponentCommand | ModalCommand>(await this.getFiles(commandsDir))).filter(
			(x) => x instanceof ComponentCommand,
		)) {
			this.commands.push(i);
		}
	}

	async executeComponent(interaction: ComponentInteraction) {
		for (const i of this.commands) {
			if (i.type === InteractionCommandType.COMPONENT && (await i.filter(interaction))) {
				await i.run(interaction);
				break;
			}
		}
	}

	async executeModal(interaction: ModalSubmitInteraction) {
		for (const i of this.commands) {
			if (i.type === InteractionCommandType.MODAL && (await i.filter(interaction))) {
				await i.run(interaction);
				break;
			}
		}
	}
}
