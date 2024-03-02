import type { AllChannels, Guild, ReturnCache, WebhookMessage } from '../..';
import type { Client, WorkerClient } from '../../client';
import { MessageFlags, type If, type UnionToTuple } from '../../common';
import type { InteractionCreateBodyRequest, InteractionMessageUpdateBodyRequest } from '../../common/types/write';
import {
	Message,
	type ChatInputCommandInteraction,
	type GuildMember,
	type InteractionGuildMember,
} from '../../structures';
import type { RegisteredMiddlewares } from '../decorators';
import type { OptionResolver } from '../optionresolver';
import type { ContextOptions, OptionsRecord } from './chat';
import type { CommandMetadata, ExtendContext, GlobalMetadata, InternalOptions, UsingClient } from './shared';

export interface CommandContext<T extends OptionsRecord = {}, M extends keyof RegisteredMiddlewares = never>
	extends ExtendContext { }

export type InferWithPrefix = InternalOptions extends { withPrefix: infer P } ? P : false;

export class CommandContext<T extends OptionsRecord = {}, M extends keyof RegisteredMiddlewares = never> {
	message!: If<InferWithPrefix, Message | undefined, undefined>;
	interaction!: If<InferWithPrefix, ChatInputCommandInteraction | undefined, ChatInputCommandInteraction>;

	messageResponse?: If<InferWithPrefix, Message | undefined>;
	constructor(
		readonly client: UsingClient,
		data: ChatInputCommandInteraction | Message,
		public resolver: OptionResolver,
		readonly shardId: number,
	) {
		if (data instanceof Message) {
			this.message = data as never;
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
		return (this.messageResponse = await (this.message! as Message)[
			!this.messageResponse && options?.reply?.(this) ? 'reply' : 'write'
		](body));
	}

	async deferReply(ephemeral = false) {
		if (this.interaction) return this.interaction.deferReply(ephemeral ? MessageFlags.Ephemeral : undefined);
		const options = (this.client as Client | WorkerClient).options?.commands;
		return (this.messageResponse = await (this.message! as Message)[options?.reply?.(this) ? 'reply' : 'write'](
			options?.deferReplyResponse?.(this) ?? { content: 'Thinking...' },
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

	async fetchResponse(): Promise<
		If<InferWithPrefix, WebhookMessage | Message | undefined, WebhookMessage | undefined>
	> {
		if (this.interaction) return this.interaction.fetchResponse();
		this.messageResponse = await this.messageResponse?.fetch();
		return this.messageResponse as undefined;
	}

	channel(mode?: 'rest' | 'flow'): Promise<If<InferWithPrefix, AllChannels | undefined, AllChannels>>;
	channel(mode?: 'cache'): ReturnCache<If<InferWithPrefix, AllChannels | undefined, AllChannels>>;
	channel(mode: 'cache' | 'rest' | 'flow' = 'cache') {
		if (this.interaction?.channel && mode === 'cache')
			return this.client.cache.asyncCache ? Promise.resolve(this.interaction.channel) : this.interaction.channel;
		switch (mode) {
			case 'cache':
				return this.client.cache.channels?.get(this.channelId);
			default:
				return this.client.channels.fetch(this.channelId, mode === 'rest');
		}
	}

	me(mode?: 'rest' | 'flow'): Promise<GuildMember>;
	me(mode?: 'cache'): ReturnCache<GuildMember | undefined>;
	me(mode: 'cache' | 'rest' | 'flow' = 'cache') {
		if (!this.guildId)
			return mode === 'cache' ? (this.client.cache.asyncCache ? Promise.resolve() : undefined) : Promise.resolve();
		switch (mode) {
			case 'cache':
				return this.client.cache.members?.get(this.client.botId, this.guildId);
			default:
				return this.client.members.fetch(this.guildId, this.client.botId, mode === 'rest');
		}
	}

	guild(mode?: 'rest' | 'flow'): Promise<Guild<'cached' | 'api'> | undefined>;
	guild(mode?: 'cache'): ReturnCache<Guild<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'cache') {
		if (!this.guildId)
			return (
				mode === 'cache' ? (this.client.cache.asyncCache ? Promise.resolve() : undefined) : Promise.resolve()
			) as any;
		switch (mode) {
			case 'cache':
				return this.client.cache.guilds?.get(this.guildId);
			default:
				return this.client.guilds.fetch(this.guildId, mode === 'rest');
		}
	}

	get guildId() {
		return this.interaction?.guildId || (this.message! as Message | undefined)?.guildId;
	}

	get channelId() {
		return this.interaction?.channelId || (this.message! as Message).channelId;
	}

	get author() {
		return this.interaction?.user || (this.message! as Message).author;
	}

	get member(): If<
		InferWithPrefix,
		GuildMember | InteractionGuildMember | undefined,
		InteractionGuildMember | undefined
	> {
		return this.interaction?.member || ((this.message! as Message)?.member as any);
	}
}
