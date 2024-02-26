import type { Client, WorkerClient } from '../../client';
import { MessageFlags, type UnionToTuple } from '../../common';
import type {
	InteractionCreateBodyRequest,
	InteractionMessageUpdateBodyRequest,
	ModalCreateBodyRequest,
} from '../../common/types/write';
import { Message, type ChatInputCommandInteraction } from '../../structures';
import type { RegisteredMiddlewares } from '../decorators';
import type { OptionResolver } from '../optionresolver';
import type { ContextOptions, OptionsRecord } from './chat';
import type { CommandMetadata, ExtendContext, GlobalMetadata, UsingClient } from './shared';

export class CommandContext<T extends OptionsRecord = {}, M extends keyof RegisteredMiddlewares = never>
	implements ExtendContext {
	interaction?: ChatInputCommandInteraction;
	message?: Message;
	messageResponse?: Message;
	constructor(
		readonly client: UsingClient,
		data: ChatInputCommandInteraction | Message,
		public resolver: OptionResolver,
		readonly shardId: number,
	) {
		if (data instanceof Message) {
			this.message = data;
		} else {
			this.interaction = data;
		}
	}

	options: ContextOptions<T> = {} as never;
	metadata: CommandMetadata<UnionToTuple<M>> = {} as never;
	globalMetadata: GlobalMetadata = {};

	get proxy() {
		return this.client.proxy;
	}

	get t() {
		return this.client.langs.get(this.interaction?.locale ?? this.client.langs.defaultLang ?? 'en-US');
	}

	async write(body: InteractionCreateBodyRequest) {
		if (this.interaction) return this.interaction.write(body);
		const options = (this.client as Client | WorkerClient).options?.commands;
		return (this.messageResponse =
			await this.message![!this.messageResponse && options?.reply ? 'reply' : 'write'](body));
	}

	modal(body: ModalCreateBodyRequest) {
		if (this.interaction) return this.interaction.modal(body);
		throw new Error('Not supported');
	}

	async deferReply(ephemeral = false) {
		if (this.interaction) return this.interaction.deferReply(ephemeral ? MessageFlags.Ephemeral : undefined);
		const options = (this.client as Client | WorkerClient).options?.commands;
		return (this.messageResponse = await this.message![options?.reply ? 'reply' : 'write'](
			options?.deferReplyResponse ?? { content: 'Thinking...' },
		));
	}

	async editResponse(body: InteractionMessageUpdateBodyRequest) {
		if (this.interaction) return this.interaction.editResponse(body);
		return (this.messageResponse = await this.messageResponse!.edit(body));
	}

	deleteResponse() {
		if (this.interaction) return this.interaction.deleteResponse();
		return this.messageResponse!.delete();
	}

	editOrReply(body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest) {
		if (this.interaction) return this.interaction.editOrReply(body as InteractionCreateBodyRequest);
		if (this.messageResponse) {
			return this.editResponse(body);
		}
		return this.write(body as InteractionCreateBodyRequest);
	}

	fetchResponse() {
		if (this.interaction) return this.interaction.fetchResponse();
		return this.messageResponse!.fetch();
	}

	channel(force = false) {
		return this.interaction?.channel || this.message!.channel(force)
	}

	me(force = false) {
		return this.guildId ? this.client.members.fetch(this.guildId, this.client.botId, force) : undefined
	}

	get guildId() {
		return this.interaction?.guildId || this.message!.guildId
	}

	get channelId() {
		return this.interaction?.channelId || this.message!.channelId
	}

	get author() {
		if (this.interaction) return this.interaction.user;
		return this.message!.author;
	}

	get member() {
		if (this.interaction) return this.interaction.member;
		return this.message!.member;
	}
}
