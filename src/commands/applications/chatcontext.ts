import type { __LangType } from '../../__generated';
import type { IClients } from '../../client/base';
import { MessageFlags } from '../../common';
import type {
	InteractionCreateBodyRequest,
	InteractionMessageUpdateBodyRequest,
	ModalCreateBodyRequest,
} from '../../common/types/write';
import { type ChatInputCommandInteraction } from '../../structures';
import type { OptionResolver } from '../optionresolver';
import { ContextOptions, OptionsRecord } from './chat';
import type { CommandMetadata, MiddlewareContext } from './shared';

export class CommandContext<
	C extends keyof IClients,
	T extends OptionsRecord = {},
	M extends Readonly<MiddlewareContext[]> = [],
> {
	constructor(
		readonly client: IClients[C],
		readonly interaction: ChatInputCommandInteraction,
		public options: ContextOptions<T>,
		public metadata: CommandMetadata<M>,
		public resolver: OptionResolver,
		readonly shardId: number,
	) {}

	get proxy() {
		return this.client.proxy;
	}

	t<K extends keyof __LangType>(message: K, metadata: __LangType[K]) {
		return this.client.langs.get(this.interaction.locale, message, metadata);
	}

	write(body: InteractionCreateBodyRequest) {
		return this.interaction.write(body);
	}

	modal(body: ModalCreateBodyRequest) {
		return this.interaction.modal(body);
	}

	deferReply(ephemeral = false) {
		return this.interaction.deferReply(ephemeral ? MessageFlags.Ephemeral : undefined);
	}

	editResponse(body: InteractionMessageUpdateBodyRequest) {
		return this.interaction.editResponse(body);
	}

	deleteResponse() {
		return this.interaction.deleteResponse();
	}

	editOrReply(body: InteractionMessageUpdateBodyRequest) {
		return this.interaction.editOrReply(body);
	}

	fetchResponse() {
		return this.interaction.fetchResponse();
	}

	get author() {
		return this.interaction.user;
	}

	get member() {
		return this.interaction.member;
	}
}
