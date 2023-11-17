import type { APIInteractionResponseChannelMessageWithSource, RESTPatchAPIWebhookWithTokenMessageJSONBody } from '@biscuitland/common';
import { InteractionResponseType } from '@biscuitland/common';
import type { RawFile } from '@biscuitland/rest';
import { Router } from '@biscuitland/rest';
import type { __LangType } from '../__generated';
import type { BaseClient } from '../client/base';
import type { ChatInputCommandInteraction } from '../structures/Interaction';
import type { MiddlewareContext, ContextOptions, CommandMetadata, OptionsRecord } from './commands';
import type { OptionResolver } from './handler';

export class CommandContext<T extends OptionsRecord, M extends Readonly<MiddlewareContext[]>> {
	constructor(private client: BaseClient, private interaction: ChatInputCommandInteraction, public options: ContextOptions<T>, public metadata: CommandMetadata<M>, public resolver: OptionResolver) { }

	private __router__ = new Router(this.interaction.rest);

	get proxy() {
		return this.__router__.createProxy();
	}

	t<K extends keyof __LangType>(message: K, metadata: __LangType[K]) {
		return this.client.langs.get(this.interaction.locale, message, metadata);
	}

	write(body: APIInteractionResponseChannelMessageWithSource['data'], files: RawFile[] = []) {
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
