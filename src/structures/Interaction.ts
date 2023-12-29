import type {
	APIActionRowComponent,
	APIApplicationCommandAutocompleteInteraction,
	APIApplicationCommandInteraction,
	APIBaseInteraction,
	APIChatInputApplicationCommandInteraction,
	APIChatInputApplicationCommandInteractionData,
	APICommandAutocompleteInteractionResponseCallbackData,
	APIInteraction,
	APIInteractionResponse,
	APIInteractionResponseChannelMessageWithSource,
	APIInteractionResponseDeferredChannelMessageWithSource,
	APIInteractionResponseDeferredMessageUpdate,
	APIInteractionResponsePong,
	APIInteractionResponseUpdateMessage,
	APIMessageApplicationCommandInteraction,
	APIMessageApplicationCommandInteractionData,
	APIMessageButtonInteractionData,
	APIMessageChannelSelectInteractionData,
	APIMessageComponentInteraction,
	APIMessageComponentSelectMenuInteraction,
	APIMessageMentionableSelectInteractionData,
	APIMessageRoleSelectInteractionData,
	APIMessageStringSelectInteractionData,
	APIMessageUserSelectInteractionData,
	APIModalSubmission,
	APIModalSubmitInteraction,
	APITextInputComponent,
	APIUserApplicationCommandInteraction,
	APIUserApplicationCommandInteractionData,
	GatewayInteractionCreateDispatchData,
	MessageFlags,
	ObjectToLower,
	RESTPostAPIInteractionCallbackJSONBody,
	When,
} from '@biscuitland/common';
import { ApplicationCommandType, ComponentType, InteractionResponseType, InteractionType } from '@biscuitland/common';
import type { RawFile } from '@biscuitland/rest';
import type { BaseClient } from '../client/base';
import { OptionResolver } from '../commands';
import { ActionRow, MessageEmbed, Modal } from '../components';
import type {
	ComponentInteractionMessageUpdate,
	InteractionCreateBodyRequest,
	InteractionMessageUpdateBodyRequest,
	MessageCreateBodyRequest,
	MessageUpdateBodyRequest,
	MessageWebhookCreateBodyRequest,
	ModalCreateBodyRequest,
} from '../types/write';
import { GuildMember, InteractionGuildMember } from './';
import { GuildRole } from './GuildRole';
import { Message } from './Message';
import { User } from './User';
import type { PotocuitChannels } from './channels';
import { DiscordBase } from './extra/DiscordBase';
import { BaseChannel } from './methods/channel/base';

export type ReplyInteractionBody =
	| { type: InteractionResponseType.Modal; data: ModalCreateBodyRequest }
	| {
			type: InteractionResponseType.ChannelMessageWithSource | InteractionResponseType.UpdateMessage;
			data: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest | ComponentInteractionMessageUpdate;
	  }
	| Exclude<RESTPostAPIInteractionCallbackJSONBody, APIInteractionResponsePong>;

/** @internal */
export type __InternalReplyFunction = (_: { body: APIInteractionResponse; files?: RawFile[] }) => Promise<any>;

export interface BaseInteraction
	extends ObjectToLower<Omit<APIBaseInteraction<InteractionType, any>, 'user' | 'member' | 'message' | 'channel'>> {}

export class BaseInteraction<
	FromGuild extends boolean = boolean,
	Type extends APIInteraction = APIInteraction,
> extends DiscordBase<Type> {
	user: User;
	member!: When<FromGuild, GuildMember, undefined>;
	channel?: PotocuitChannels;
	message?: Message;
	replied?: Promise<boolean> | boolean;

	constructor(readonly client: BaseClient, interaction: Type, protected __reply?: __InternalReplyFunction) {
		super(client, interaction);
		if (interaction.member) {
			this.member = new GuildMember(
				client,
				interaction.member,
				interaction.member!.user,
				interaction.guild_id!,
			) as never;
		}
		if (interaction.message) {
			this.message = new Message(client, interaction.message);
		}
		if (interaction.channel) {
			this.channel = BaseChannel.from(interaction.channel, client);
		}
		this.user = this.member?.user ?? new User(client, interaction.user!);
	}

	static transformBodyRequest(body: ReplyInteractionBody): APIInteractionResponse {
		switch (body.type) {
			case InteractionResponseType.ApplicationCommandAutocompleteResult:
			case InteractionResponseType.DeferredMessageUpdate:
			case InteractionResponseType.DeferredChannelMessageWithSource:
				return body;
			case InteractionResponseType.ChannelMessageWithSource:
			case InteractionResponseType.UpdateMessage:
				return {
					type: body.type,
					data: {
						...(body.data ?? {}),
						// @ts-expect-error
						components: body.data?.components?.map((x) => (x instanceof ActionRow ? x.toJSON() : x)) ?? [],
						embeds: body.data?.embeds?.map((x) => (x instanceof MessageEmbed ? x.toJSON() : x)) ?? [],
					},
				};
			case InteractionResponseType.Modal:
				return {
					type: body.type,
					data:
						body.data instanceof Modal
							? body.data.toJSON()
							: {
									...body.data,
									components: body.data?.components
										? body.data.components.map((x) =>
												x instanceof ActionRow
													? (x.toJSON() as unknown as APIActionRowComponent<APITextInputComponent>)
													: x,
										  )
										: [],
							  },
				};
			default:
				return body;
		}
	}

	static transformBody<T>(
		body:
			| InteractionMessageUpdateBodyRequest
			| MessageUpdateBodyRequest
			| MessageCreateBodyRequest
			| MessageWebhookCreateBodyRequest,
	) {
		return {
			...body,
			components: body?.components?.map((x) => (x instanceof ActionRow ? x.toJSON() : x)) ?? [],
			embeds: body?.embeds?.map((x) => (x instanceof MessageEmbed ? x.toJSON() : x)) ?? [],
		} as T;
	}

	async reply(body: ReplyInteractionBody, files?: RawFile[]) {
		if (this.replied) {
			throw new Error('Interaction already replied');
		}

		this.replied = (this.__reply ?? this.api.interactions(this.id)(this.token).callback.post)({
			body: BaseInteraction.transformBodyRequest(body),
			files,
		}).then(() => (this.replied = true));

		await this.replied;

		this.client.components.onRequestInteraction(
			body.type === InteractionResponseType.Modal ? this.user.id : this.id,
			body,
		);
	}

	deferReply(flags?: MessageFlags) {
		return this.reply({
			type: InteractionResponseType.DeferredChannelMessageWithSource,
			data: {
				flags,
			},
		});
	}

	static from(client: BaseClient, gateway: GatewayInteractionCreateDispatchData, __reply?: __InternalReplyFunction) {
		switch (gateway.type) {
			case InteractionType.ApplicationCommandAutocomplete:
				return new AutocompleteInteraction(client, gateway, __reply);
			// biome-ignore lint/suspicious/noFallthroughSwitchClause: bad interaction  between biome and ts-server
			case InteractionType.ApplicationCommand:
				switch (gateway.data.type) {
					case ApplicationCommandType.ChatInput:
						return new ChatInputCommandInteraction(
							client,
							gateway as APIChatInputApplicationCommandInteraction,
							__reply,
						);
					case ApplicationCommandType.User:
						return new UserCommandInteraction(client, gateway as APIUserApplicationCommandInteraction, __reply);
					case ApplicationCommandType.Message:
						return new MessageCommandInteraction(client, gateway as APIMessageApplicationCommandInteraction, __reply);
				}
			// biome-ignore lint/suspicious/noFallthroughSwitchClause: bad interaction  between biome and ts-server
			case InteractionType.MessageComponent:
				switch (gateway.data.component_type) {
					case ComponentType.Button:
						return new ButtonInteraction(client, gateway as APIMessageComponentInteraction, __reply);
					case ComponentType.ChannelSelect:
						return new ChannelSelectMenuInteraction(
							client,
							gateway as APIMessageComponentSelectMenuInteraction,
							__reply,
						);
					case ComponentType.RoleSelect:
						return new RoleSelectMenuInteraction(client, gateway as APIMessageComponentSelectMenuInteraction, __reply);
					case ComponentType.MentionableSelect:
						return new MentionableSelectMenuInteraction(
							client,
							gateway as APIMessageComponentSelectMenuInteraction,
							__reply,
						);
					case ComponentType.UserSelect:
						return new UserSelectMenuInteraction(client, gateway as APIMessageComponentSelectMenuInteraction, __reply);
					case ComponentType.StringSelect:
						return new StringSelectMenuInteraction(
							client,
							gateway as APIMessageComponentSelectMenuInteraction,
							__reply,
						);
				}
			case InteractionType.ModalSubmit:
				return new ModalSubmitInteraction(client, gateway);
			default:
				return new BaseInteraction(client, gateway);
		}
	}
}

export type PotoInteraction =
	| AutocompleteInteraction
	| ChatInputCommandInteraction
	| UserCommandInteraction
	| MessageCommandInteraction
	| ComponentInteraction
	| SelectMenuInteraction
	| ModalSubmitInteraction
	| BaseInteraction;

export interface AutocompleteInteraction
	extends ObjectToLower<
		Omit<APIApplicationCommandAutocompleteInteraction, 'user' | 'member' | 'type' | 'data' | 'message' | 'channel'>
	> {}

export class AutocompleteInteraction<FromGuild extends boolean = boolean> extends BaseInteraction<
	FromGuild,
	APIApplicationCommandAutocompleteInteraction
> {
	declare type: InteractionType.ApplicationCommandAutocomplete;
	declare data: ObjectToLower<APIApplicationCommandAutocompleteInteraction['data']>;
	options: OptionResolver;
	constructor(
		client: BaseClient,
		interaction: APIApplicationCommandAutocompleteInteraction,
		protected __reply?: __InternalReplyFunction,
	) {
		super(client, interaction);
		this.options = new OptionResolver(
			client,
			interaction.data.options,
			undefined,
			interaction.guild_id,
			interaction.data.resolved,
		);
	}

	getInput() {
		return this.options.getAutocompleteValue() ?? '';
	}

	respond(choices: APICommandAutocompleteInteractionResponseCallbackData['choices']) {
		return super.reply({ data: { choices }, type: InteractionResponseType.ApplicationCommandAutocompleteResult });
	}

	/** @intenal */
	async reply(..._args: unknown[]) {
		throw new Error('Cannot use reply in this interaction');
	}
}

export class Interaction<
	FromGuild extends boolean = boolean,
	Type extends APIInteraction = APIInteraction,
> extends BaseInteraction<FromGuild, Type> {
	fetchMessage(messageId: string) {
		return this.api
			.webhooks(this.applicationId)(this.token)
			.messages(messageId)
			.get()
			.then((data) => new Message(this.client, data));
	}

	fetchResponse() {
		return this.fetchMessage('@original');
	}

	write(body: InteractionCreateBodyRequest, files?: RawFile[]) {
		return this.reply(
			{
				type: InteractionResponseType.ChannelMessageWithSource,
				data: body,
			},
			files,
		);
	}

	modal(body: ModalCreateBodyRequest) {
		return this.reply({
			type: InteractionResponseType.Modal,
			data: body,
		});
	}

	async editOrReply(body: InteractionMessageUpdateBodyRequest, files?: RawFile[]) {
		if (await this.replied) {
			return this.editResponse(body, files);
		}
		return this.reply(
			{
				type: InteractionResponseType.ChannelMessageWithSource,
				data: body,
			},
			files,
		);
	}

	async editMessage(messageId: string, body: InteractionMessageUpdateBodyRequest, files?: RawFile[]) {
		const apiMessage = await this.api
			.webhooks(this.applicationId)(this.token)
			.messages(messageId)
			.patch({
				body: BaseInteraction.transformBody(body),
				files,
			});

		this.client.components.onRequestInteractionUpdate(body, apiMessage);
		return new Message(this.client, apiMessage);
	}

	editResponse(body: InteractionMessageUpdateBodyRequest, files: RawFile[] = []) {
		return this.editMessage('@original', body, files);
	}

	deleteResponse() {
		return this.deleteMessage('@original');
	}

	deleteMessage(messageId: string) {
		return this.api
			.webhooks(this.applicationId)(this.token)
			.messages(messageId)
			.delete()
			.then(() => this.client.components.onMessageDelete(messageId === '@original' ? this.id : messageId));
	}

	async createResponse(body: MessageWebhookCreateBodyRequest, files: RawFile[]) {
		const apiMessage = await this.api
			.webhooks(this.applicationId)(this.token)
			.post({
				body: BaseInteraction.transformBody(body),
				files,
			});

		this.client.components.onRequestMessage(body, apiMessage);
	}
}

export class ApplicationCommandInteraction<
	FromGuild extends boolean = boolean,
	Type extends APIApplicationCommandInteraction = APIApplicationCommandInteraction,
> extends Interaction<FromGuild, Type> {
	declare type: InteractionType.ApplicationCommand;
	respond(
		data:
			| APIInteractionResponseChannelMessageWithSource
			| APIInteractionResponseDeferredChannelMessageWithSource
			| APIInteractionResponseDeferredMessageUpdate
			| APIInteractionResponseUpdateMessage,
		files: RawFile[] = [],
	) {
		return this.reply(data, files);
	}
}

export interface ComponentInteraction
	extends ObjectToLower<
		Omit<APIMessageComponentInteraction, 'user' | 'member' | 'type' | 'data' | 'message' | 'channel'>
	> {}

export class ComponentInteraction<
	FromGuild extends boolean = boolean,
	Type extends APIMessageComponentInteraction = APIMessageComponentInteraction,
> extends Interaction<FromGuild, Type> {
	declare data: ObjectToLower<APIMessageComponentInteraction['data']>;
	declare channelId: string;
	declare appPermissions: string;
	declare channel: PotocuitChannels;
	declare type: InteractionType.MessageComponent;

	update(data: ComponentInteractionMessageUpdate, files: RawFile[] = []) {
		return this.reply(
			{
				type: InteractionResponseType.UpdateMessage,
				data,
			},
			files,
		);
	}

	deferUpdate() {
		return this.reply({
			type: InteractionResponseType.DeferredMessageUpdate,
		});
	}

	get customId() {
		return this.data.customId;
	}

	get componentType() {
		return this.data.componentType;
	}

	isButton(): this is ButtonInteraction {
		return this.data.componentType === ComponentType.Button;
	}

	isChannelSelectMenu(): this is ChannelSelectMenuInteraction {
		return this.componentType === ComponentType.ChannelSelect;
	}

	isRoleSelectMenu(): this is RoleSelectMenuInteraction {
		return this.componentType === ComponentType.RoleSelect;
	}

	isMentionableSelectMenu(): this is MentionableSelectMenuInteraction {
		return this.componentType === ComponentType.MentionableSelect;
	}

	isUserSelectMenu(): this is UserSelectMenuInteraction {
		return this.componentType === ComponentType.UserSelect;
	}

	isStringSelectMenu(): this is StringSelectMenuInteraction {
		return this.componentType === ComponentType.StringSelect;
	}
}

export class ButtonInteraction extends ComponentInteraction {
	declare data: ObjectToLower<APIMessageButtonInteractionData>;
}

export class SelectMenuInteraction extends ComponentInteraction {
	declare data: ObjectToLower<APIMessageComponentSelectMenuInteraction['data']>;

	constructor(
		client: BaseClient,
		interaction: APIMessageComponentSelectMenuInteraction,
		protected __reply?: __InternalReplyFunction,
	) {
		super(client, interaction);
	}

	get values() {
		return this.data.values;
	}
}

export class StringSelectMenuInteraction extends SelectMenuInteraction {
	declare data: ObjectToLower<APIMessageStringSelectInteractionData>;
}

export class ChannelSelectMenuInteraction extends SelectMenuInteraction {
	channels: PotocuitChannels[];
	constructor(
		client: BaseClient,
		interaction: APIMessageComponentSelectMenuInteraction,
		protected __reply?: __InternalReplyFunction,
	) {
		super(client, interaction);
		const resolved = (interaction.data as APIMessageChannelSelectInteractionData).resolved;
		this.channels = this.values.map((x) => BaseChannel.from(resolved.channels[x], this.client));
	}
}

export class MentionableSelectMenuInteraction extends SelectMenuInteraction {
	roles: GuildRole[];
	members: InteractionGuildMember[];
	users: User[];
	constructor(
		client: BaseClient,
		interaction: APIMessageComponentSelectMenuInteraction,
		protected __reply?: __InternalReplyFunction,
	) {
		super(client, interaction);
		const resolved = (interaction.data as APIMessageMentionableSelectInteractionData).resolved;
		this.roles = resolved.roles
			? this.values.map((x) => new GuildRole(this.client, resolved.roles![x], this.guildId!))
			: [];
		this.members = resolved.members
			? this.values.map(
					(x) =>
						new InteractionGuildMember(
							this.client,
							resolved.members![x],
							this.users!.find((u) => u.id === x)!,
							this.guildId!,
						),
			  )
			: [];
		this.users = resolved.users ? this.values.map((x) => new User(this.client, resolved.users![x])) : [];
	}
}

export class RoleSelectMenuInteraction extends SelectMenuInteraction {
	roles: GuildRole[];
	constructor(
		client: BaseClient,
		interaction: APIMessageComponentSelectMenuInteraction,
		protected __reply?: __InternalReplyFunction,
	) {
		super(client, interaction);
		const resolved = (interaction.data as APIMessageRoleSelectInteractionData).resolved;
		this.roles = this.values.map((x) => new GuildRole(this.client, resolved.roles[x], this.guildId!));
	}
}

export class UserSelectMenuInteraction extends SelectMenuInteraction {
	members: InteractionGuildMember[];
	users: User[];
	constructor(
		client: BaseClient,
		interaction: APIMessageComponentSelectMenuInteraction,
		protected __reply?: __InternalReplyFunction,
	) {
		super(client, interaction);
		const resolved = (interaction.data as APIMessageUserSelectInteractionData).resolved;
		this.users = this.values.map((x) => new User(this.client, resolved.users[x]));
		this.members = resolved.members
			? this.values.map(
					(x) =>
						new InteractionGuildMember(
							this.client,
							resolved.members![x],
							this.users!.find((u) => u.id === x)!,
							this.guildId!,
						),
			  )
			: [];
	}
}

export class ChatInputCommandInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<
	FromGuild,
	APIChatInputApplicationCommandInteraction
> {
	declare data: ObjectToLower<APIChatInputApplicationCommandInteractionData>;
}

export class UserCommandInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<
	FromGuild,
	APIUserApplicationCommandInteraction
> {
	declare data: ObjectToLower<APIUserApplicationCommandInteractionData>;
}

export class MessageCommandInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<
	FromGuild,
	APIMessageApplicationCommandInteraction
> {
	declare data: ObjectToLower<APIMessageApplicationCommandInteractionData>;
}

export class ModalSubmitInteraction<FromGuild extends boolean = boolean> extends Interaction<
	FromGuild,
	APIModalSubmitInteraction
> {
	declare data: ObjectToLower<APIModalSubmission>;
	get customId() {
		return this.data.customId;
	}

	get components() {
		return this.data.components;
	}
}
