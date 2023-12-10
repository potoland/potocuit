import { InteractionResponseType, MessageFlags } from '@biscuitland/common';
import type { RawFile } from '@biscuitland/rest';
import type { __LangType } from '../__generated';
import type { BaseClient } from '../client/base';
import { type ChatInputCommandInteraction } from '../structures';
import type { MiddlewareContext, ContextOptions, CommandMetadata, OptionsRecord } from './commands';
import type { OptionResolver } from './optionresolver';
import type { InteractionCreateBodyRequest, InteractionMessageUpdateBodyRequest } from '../types/write';

export class CommandContext<T extends OptionsRecord = {}, M extends Readonly<MiddlewareContext[]> = []> {
	constructor(private client: BaseClient, readonly interaction: ChatInputCommandInteraction, public options: ContextOptions<T>, public metadata: CommandMetadata<M>, public resolver: OptionResolver) { }

	get proxy() {
		return this.client.proxy;
	}

	t<K extends keyof __LangType>(message: K, metadata: __LangType[K]) {
		return this.client.langs.get(this.interaction.locale, message, metadata);
	}

	write(body: InteractionCreateBodyRequest, files: RawFile[] = []) {
		return this.interaction.reply(
			{
				data: body,
				type: InteractionResponseType.ChannelMessageWithSource
			},
			files,
		);
	}

	deferReply(ephemeral = false) {
		return this.interaction.reply({
			data: { flags: ephemeral ? MessageFlags.Ephemeral : undefined },
			type: InteractionResponseType.DeferredChannelMessageWithSource
		});
	}

	editResponse(body: InteractionMessageUpdateBodyRequest, files?: RawFile[]) {
		return this.interaction.editResponse(body, files);
	}

	deleteResponse() {
		return this.interaction.deleteResponse();
	}

	editOrReply(body: InteractionMessageUpdateBodyRequest, files?: RawFile[]) {
		return this.interaction.editOrReply(body, files);
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
