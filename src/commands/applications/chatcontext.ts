import { MessageFlags, type UnionToTuple } from '../../common';
import type {
	InteractionCreateBodyRequest,
	InteractionMessageUpdateBodyRequest,
	ModalCreateBodyRequest,
} from '../../common/types/write';
import type { ChatInputCommandInteraction } from '../../structures';
import type { RegisteredMiddlewares } from '../decorators';
import type { OptionResolver } from '../optionresolver';
import type { ContextOptions, OptionsRecord } from './chat';
import type { CommandMetadata, DefaultLocale, ExtendContext, GlobalMetadata, UsingClient } from './shared';

export class CommandContext<T extends OptionsRecord = {}, M extends keyof RegisteredMiddlewares = never>
	implements ExtendContext
{
	constructor(
		readonly client: UsingClient,
		readonly interaction: ChatInputCommandInteraction,
		public resolver: OptionResolver,
		readonly shardId: number,
	) {}

	options: ContextOptions<T> = {} as never;
	metadata: CommandMetadata<UnionToTuple<M>> = {} as never;
	globalMetadata: GlobalMetadata = {};

	get proxy() {
		return this.client.proxy;
	}

	get t(): DefaultLocale {
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
