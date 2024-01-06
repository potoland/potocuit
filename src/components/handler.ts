import {
	APIMessage,
	APIModalInteractionResponseCallbackData,
	Button,
	InteractionResponseType,
	LimitedCollection,
} from '..';
import type { ListenerOptions, PotoComponents } from '../builders';
import { ComponentCallback, ModalSubmitCallback } from '../builders/types';
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
import { ComponentsListener } from './listener';

type COMPONENTS = {
	options: ListenerOptions | undefined;
	buttons: Partial<
		Record<
			string,
			{
				callback: ComponentCallback;
			}
		>
	>;
	idle?: NodeJS.Timeout;
	timeout?: NodeJS.Timeout;
};

export class ComponentHandler extends PotoHandler {
	readonly values = new Map<string, COMPONENTS>();
	// 10 minutes timeout, because discord dont send an event when the user cancel the modal
	readonly modals = new LimitedCollection<string, ModalSubmitCallback>({ expire: 60e3 * 10 });
	readonly commands: (ComponentCommand | ModalCommand)[] = [];
	protected filter = (path: string) => path.endsWith('.js');

	constructor(logger: Logger, protected client: BaseClient) {
		super(logger);
	}

	hasComponent(id: string, customId: string) {
		return !!this.values.get(id)?.buttons?.[customId];
	}

	async onComponent(id: string, interaction: ComponentInteraction) {
		const row = this.values.get(id);
		const component = row?.buttons?.[interaction.customId];
		if (!component) return;
		if (row.options?.filter) {
			if (!(await row.options.filter(interaction))) return;
		}
		row.idle?.refresh();
		await component.callback(
			interaction,
			(reason) => {
				row.options?.onStop?.(reason ?? 'stop');
				this.deleteValue(id);
			},
			() => {
				this.resetTimeouts(id);
			},
		);
	}

	resetTimeouts(id: string) {
		const listener = this.values.get(id);
		if (!listener) return;
		listener.timeout?.refresh();
		listener.idle?.refresh();
	}

	hasModal(interaction: ModalSubmitInteraction) {
		return this.modals.has(interaction.user.id);
	}

	onModalSubmit(interaction: ModalSubmitInteraction) {
		setImmediate(() => this.modals.delete(interaction.user.id));
		return this.modals.get(interaction.user.id)?.(interaction);
	}

	__setComponents(id: string, record: ComponentsListener<PotoComponents>) {
		const components: COMPONENTS = {
			buttons: {},
			options: record.options,
		};

		if (!record.options) return;

		for (const actionRow of record.components) {
			for (const child of actionRow.components) {
				if (child instanceof Button && 'custom_id' in child.data) {
					if ((record.options.idle ?? -1) > 0) {
						components.idle = setTimeout(() => {
							clearTimeout(components.timeout);
							clearTimeout(components.idle);
							record.options?.onStop?.('idle', () => {
								this.__setComponents(id, record);
							});
							this.values.delete(id);
						}, record.options.idle);
					}
					if ((record.options.timeout ?? -1) > 0) {
						components.timeout = setTimeout(() => {
							clearTimeout(components.timeout);
							clearTimeout(components.idle);
							record.options?.onStop?.('timeout', () => {
								this.__setComponents(id, record);
							});
							this.values.delete(id);
						}, record.options.timeout);
					}
					components.buttons[child.data.custom_id!] = {
						callback: child.__exec as ComponentCallback,
					};
				}
			}
		}

		if (Object.entries(components.buttons).length) {
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
		if (!interaction.data || !(interaction.data.components instanceof ComponentsListener)) {
			return;
		}
		switch (interaction.type) {
			case InteractionResponseType.ChannelMessageWithSource:
			case InteractionResponseType.UpdateMessage:
				if (!interaction.data.components.components?.length) {
					return;
				}
				this.__setComponents(interactionId, interaction.data.components ?? []);
				break;
			case InteractionResponseType.Modal:
				this.__setModal(interactionId, interaction.data);
				break;
		}
	}

	deleteValue(id: string) {
		const component = this.values.get(id);
		if (component) {
			clearTimeout(component.timeout);
			clearTimeout(component.idle);
			this.values.delete(id);
		}
	}

	onMessageDelete(id: string) {
		this.deleteValue(id);
	}

	onRequestInteractionUpdate(body: InteractionMessageUpdateBodyRequest, message: APIMessage) {
		if (!(body.components instanceof ComponentsListener) || !body.components.components?.length) {
			return;
		}
		if (message.interaction?.id) {
			this.deleteValue(message.interaction.id);
		}
		this.__setComponents(message.id, body.components);
	}

	onRequestMessage(body: MessageCreateBodyRequest, message: APIMessage) {
		if (!(body.components instanceof ComponentsListener) || !body.components.components?.length) {
			return;
		}
		this.__setComponents(message.id, body.components);
	}

	onRequestUpdateMessage(body: MessageUpdateBodyRequest, message: APIMessage) {
		if (!(body.components instanceof ComponentsListener) || !body.components.components.length) return;
		this.deleteValue(message.id);
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
