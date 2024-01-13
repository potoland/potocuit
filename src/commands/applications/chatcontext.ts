import type { IClients } from '../../client/base';
import { MessageFlags } from '../../common';
import type {
	InteractionCreateBodyRequest,
	InteractionMessageUpdateBodyRequest,
	ModalCreateBodyRequest,
} from '../../common/types/write';
import type { ChatInputCommandInteraction } from '../../structures';
import type { OptionResolver } from '../optionresolver';
import type { ContextOptions, OptionsRecord } from './chat';
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

	/**@internal */
	get t() {
		return this.client.langs.get(this.interaction.locale);
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

	editOrReply(body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest) {
		return this.interaction.editOrReply(body as InteractionCreateBodyRequest);
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
