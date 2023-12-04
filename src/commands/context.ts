import type { RESTPatchAPIWebhookWithTokenMessageJSONBody } from '@biscuitland/common';
import { InteractionResponseType } from '@biscuitland/common';
import type { RawFile } from '@biscuitland/rest';
import type { __LangType } from '../__generated';
import type { BaseClient } from '../client/base';
import { type ChatInputCommandInteraction } from '../structures';
import type { MiddlewareContext, ContextOptions, CommandMetadata, OptionsRecord } from './commands';
import type { OptionResolver } from './optionresolver';
import type { InteractionCreateBodyRequest } from '../types/write';

export class CommandContext<T extends OptionsRecord, M extends Readonly<MiddlewareContext[]>> {
	constructor(private client: BaseClient, readonly interaction: ChatInputCommandInteraction, public options: ContextOptions<T>, public metadata: CommandMetadata<M>, public resolver: OptionResolver) { }

	get proxy() {
		return this.client.proxy;
	}

	t<K extends keyof __LangType>(message: K, metadata: __LangType[K]) {
		return this.client.langs.get(this.interaction.locale, message, metadata);
	}

	write(body: InteractionCreateBodyRequest, files: RawFile[] = []) {
		console.log(body);
		return this.interaction.reply(
			{
				data: body,
				type: InteractionResponseType.ChannelMessageWithSource
			},
			files,
		);
	}

	deleteResponse() {
		return this.interaction.deleteResponse();
	}

	editResponse(body: RESTPatchAPIWebhookWithTokenMessageJSONBody, files?: RawFile[]) {
		return this.interaction.editResponse(body, files);
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
