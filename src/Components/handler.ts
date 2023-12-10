import type { BaseClient } from '../client/base';
import type { APIActionRowComponent, APIMessage, APIMessageActionRowComponent, APIModalInteractionResponseCallbackData } from '@biscuitland/common';
import { InteractionResponseType } from '@biscuitland/common';
import type { ModalSubmitCallback, ActionRow, ComponentCallback, PotoComponents } from './builders';
import type { ComponentInteraction, ModalSubmitInteraction, ReplyInteractionBody } from '../structures';
import type { InteractionMessageUpdateBodyRequest, MessageCreateBodyRequest, MessageUpdateBodyRequest, ModalCreateBodyRequest } from '../types/write';

export class ComponentHandler {
	readonly components = new Map<string, Partial<Record<string, ComponentCallback>>>;
	readonly modals = new Map<string, ModalSubmitCallback>;

	constructor(protected client: BaseClient) { }

	onComponent(id: string, interaction: ComponentInteraction) {
		return this.components.get(id)?.[interaction.customId]?.(interaction);
	}

	onModalSubmit(interaction: ModalSubmitInteraction) {
		return this.modals.get(interaction.user.id)?.(interaction);
	}

	onMessageDelete(id: string) {
		this.components.delete(id);
	}

	protected __setComponents(id: string, record: ActionRow<PotoComponents>[] | APIActionRowComponent<APIMessageActionRowComponent>[]) {
		const components: Record<string, ComponentCallback> = {};

		for (const actionRow of record) {
			for (const child of actionRow.components) {
				if ('data' in child && 'custom_id' in child.data && '__exec' in child) {
					components[child.data.custom_id!] = child.__exec as ComponentCallback;
				}
			}
		}

		if (Object.entries(components).length) {
			this.components.set(id, components);
		}
	}

	protected __setModal(id: string, record: APIModalInteractionResponseCallbackData | ModalCreateBodyRequest) {
		if ('__exec' in record) {
			this.modals.set(id, record.__exec);
		}
	}

	onRequestInteraction(interactionId: string, interaction: ReplyInteractionBody) {
		// @ts-expect-error
		if (!interaction.data) { return; }
		switch (interaction.type) {
			case InteractionResponseType.ChannelMessageWithSource:
			case InteractionResponseType.UpdateMessage:
				if (!interaction.data.components?.length) { return; }
				this.__setComponents(interactionId, interaction.data.components ?? []);
				break;
			case InteractionResponseType.Modal:
				this.__setModal(interactionId, interaction.data);
				break;
		}
	}

	onRequestInteractionUpdate(body: InteractionMessageUpdateBodyRequest, message: APIMessage) {
		if (!body.components?.length) { return; }
		if (message.interaction?.id) {
			this.components.delete(message.interaction.id);
		}
		this.__setComponents(message.id, body.components);
	}

	onRequestMessage(body: MessageCreateBodyRequest, message: APIMessage) {
		if (!body.components?.length) { return; }
		this.__setComponents(message.id, body.components);
	}

	onRequestUpdateMessage(body: MessageUpdateBodyRequest, message: APIMessage) {
		if (!body.components?.length) { return; }
		this.components.delete(message.id);
		this.__setComponents(message.id, body.components);
	}
}
