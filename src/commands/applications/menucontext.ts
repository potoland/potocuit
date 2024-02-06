import type { IClients } from '../../client/base';
import {
	ApplicationCommandType,
	MessageFlags,
	UnionToTuple,
	toSnakeCase,
	type InteractionCreateBodyRequest,
	type InteractionMessageUpdateBodyRequest,
	type ModalCreateBodyRequest,
} from '../../common';
import { Message, User, type MessageCommandInteraction, type UserCommandInteraction } from '../../structures';
import type { RegisteredMiddlewares } from '../decorators';
import type { CommandMetadata, DefaultLocale, ExtendContext, GlobalMetadata } from './shared';

export type InteractionTarget<T> = T extends MessageCommandInteraction ? Message : User;
export class MenuCommandContext<
	C extends keyof IClients,
	T extends MessageCommandInteraction | UserCommandInteraction,
	M extends keyof RegisteredMiddlewares = never,
> implements ExtendContext {
	constructor(
		readonly client: IClients[C],
		readonly interaction: T,
		public metadata: CommandMetadata<UnionToTuple<M>>,
		readonly shardId: number,
	) { }

	globalMetadata: GlobalMetadata = {}

	get proxy() {
		return this.client.proxy;
	}

	// biome-ignore lint/suspicious/useGetterReturn: bugged
	get target(): InteractionTarget<T> {
		switch (this.interaction.data.type) {
			case ApplicationCommandType.Message: {
				const data = this.interaction.data.resolved.messages[this.interaction.data.targetId as Lowercase<string>];
				return new Message(this.client, toSnakeCase(data)) as never;
			}
			case ApplicationCommandType.User: {
				const data = this.interaction.data.resolved.users[this.interaction.data.targetId as Lowercase<string>];
				return new User(this.client, toSnakeCase(data)) as never;
			}
		}
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
