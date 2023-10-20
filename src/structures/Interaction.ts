import type { APIBaseInteraction, APIInteraction, APIInteractionResponsePong, ObjectToLower, RESTPostAPIInteractionCallbackJSONBody, GatewayInteractionCreateDispatchData, When, RESTPatchAPIWebhookWithTokenMessageJSONBody, APIApplicationCommandAutocompleteInteraction, APICommandAutocompleteInteractionResponseCallbackData, APIInteractionResponseChannelMessageWithSource, APIInteractionResponseDeferredChannelMessageWithSource, APIInteractionResponseDeferredMessageUpdate, APIInteractionResponseUpdateMessage, APIApplicationCommandInteraction, APIChatInputApplicationCommandInteraction, APIUserApplicationCommandInteraction, APIMessageApplicationCommandInteraction, APIMessageComponentInteraction, APIMessageChannelSelectInteractionData, APIMessageComponentSelectMenuInteraction, APIMessageMentionableSelectInteractionData, APIMessageRoleSelectInteractionData, APIMessageUserSelectInteractionData, APIChatInputApplicationCommandInteractionData, APIMessageApplicationCommandInteractionData, APIUserApplicationCommandInteractionData, APIModalSubmission, APIModalSubmitInteraction } from '@biscuitland/common';
import { InteractionType, InteractionResponseType, ComponentType, ApplicationCommandType } from '@biscuitland/common';
import type { BiscuitREST, RawFile } from '@biscuitland/rest';
import { DiscordBase } from './extra/DiscordBase';
import type { Cache } from '../cache';
import { User } from './User';
import { GuildMember, InteractionGuildMember } from './GuildMember';
import { Message } from './Message';
import { BaseChannel } from './methods/channel/base';
import { GuildRole } from './GuildRole';
import type { PotocuitChannels } from './channels';

export interface BaseInteraction extends ObjectToLower<Omit<APIBaseInteraction<InteractionType, any>, 'user' | 'member' | 'message' | 'channel'>> { }

export class BaseInteraction<FromGuild extends boolean = boolean, Type extends APIInteraction = APIInteraction> extends DiscordBase<Type> {
	user: User;
	member!: When<FromGuild, GuildMember, undefined>;
	channel?: PotocuitChannels;
	message?: Message;
	constructor(rest: BiscuitREST, cache: Cache, interaction: Type) {
		super(rest, cache, interaction);
		if (interaction.member) { this.member = new GuildMember(rest, cache, interaction.member, interaction.member!.user, interaction.guild_id!) as never; }
		if (interaction.message) { this.message = new Message(rest, cache, interaction.message); }
		if (interaction.channel) { this.channel = BaseChannel.from(interaction.channel, rest, cache); }
		this.user = this.member?.user ?? new User(rest, cache, interaction.user!);
	}

	reply(body: Exclude<RESTPostAPIInteractionCallbackJSONBody, APIInteractionResponsePong>, files?: RawFile[]) {
		return this.api.interactions(this.id)(this.token).callback.post({
			body,
			files,
		});
	}

	static from(rest: BiscuitREST, cache: Cache, gateway: GatewayInteractionCreateDispatchData) {
		switch (gateway.type) {
			case InteractionType.ApplicationCommandAutocomplete:
				return new AutocompleteInteraction(rest, cache, gateway);
			case InteractionType.ApplicationCommand:
				switch (gateway.data.type) {
					case ApplicationCommandType.ChatInput:
						return new ChatInputCommandInteraction(rest, cache, gateway as APIChatInputApplicationCommandInteraction);
					case ApplicationCommandType.User:
						return new UserCommandInteraction(rest, cache, gateway as APIUserApplicationCommandInteraction);
					case ApplicationCommandType.Message:
						return new MessageCommandInteraction(rest, cache, gateway as APIMessageApplicationCommandInteraction);
				}
			case InteractionType.MessageComponent:
				switch (gateway.data.component_type) {
					case ComponentType.Button:
						return new ComponentInteraction(rest, cache, gateway);
					case ComponentType.ChannelSelect:
					case ComponentType.RoleSelect:
					case ComponentType.MentionableSelect:
					case ComponentType.UserSelect:
					case ComponentType.StringSelect:
						return new SelectMenuInteraction(rest, cache, gateway as APIMessageComponentSelectMenuInteraction);
				}
			case InteractionType.ModalSubmit:
			case InteractionType.Ping: // soontm, usar low-http-server (u otro) o implemetacion propia.
			default:
				return new BaseInteraction(rest, cache, gateway);
		}
	}
}


export interface AutocompleteInteraction extends ObjectToLower<Omit<APIApplicationCommandAutocompleteInteraction, 'user' | 'member' | 'type' | 'data' | 'message' | 'channel'>> { }

export class AutocompleteInteraction<FromGuild extends boolean = boolean> extends BaseInteraction<FromGuild, APIApplicationCommandAutocompleteInteraction> {
	declare type: InteractionType.ApplicationCommandAutocomplete;
	declare data: ObjectToLower<APIApplicationCommandAutocompleteInteraction['data']>;
	respond(choices: APICommandAutocompleteInteractionResponseCallbackData) {
		return this.reply({ data: choices, type: InteractionResponseType.ApplicationCommandAutocompleteResult });
	}
}

export class Interaction<FromGuild extends boolean = boolean, Type extends APIInteraction = APIInteraction> extends BaseInteraction<FromGuild, Type> {
	getMessage(messageId: string) {
		return this.api.webhooks(this.applicationId)(this.token).messages(messageId).get().then(data => new Message(this.rest, this.cache, data));
	}

	getResponse() {
		return this.getMessage('@original');
	}

	editMessage(messageId: string, body: RESTPatchAPIWebhookWithTokenMessageJSONBody, files?: RawFile[]) {
		return this.api.webhooks(this.applicationId)(this.token).messages(messageId).patch({
			body, files
		}).then(data => new Message(this.rest, this.cache, data));
	}

	editResponse(body: RESTPatchAPIWebhookWithTokenMessageJSONBody, files: RawFile[] = []) {
		return this.editMessage('@original', body, files);
	}

	deleteMessage(messageId: string) {
		return this.api.webhooks(this.applicationId)(this.token).messages(messageId).delete();
	}

	deleteResponse() {
		return this.deleteMessage('@original');
	}
}

export class ApplicationCommandInteraction<FromGuild extends boolean = boolean, Type extends APIApplicationCommandInteraction = APIApplicationCommandInteraction>
	extends Interaction<FromGuild, Type> {
	declare type: InteractionType.ApplicationCommand;
	respond(
		data: APIInteractionResponseChannelMessageWithSource | APIInteractionResponseDeferredChannelMessageWithSource | APIInteractionResponseDeferredMessageUpdate | APIInteractionResponseUpdateMessage,
		files: RawFile[] = []
	) {
		return this.reply(data, files);
	}
}

export interface ComponentInteraction extends ObjectToLower<Omit<APIMessageComponentInteraction, 'user' | 'member' | 'type' | 'data' | 'message' | 'channel'>> { }

export class ComponentInteraction<FromGuild extends boolean = boolean, Type extends APIMessageComponentInteraction = APIMessageComponentInteraction> extends Interaction<FromGuild, Type> {
	declare data: APIMessageComponentInteraction['data'];
	declare channelId: string;
	declare appPermissions: string;
	declare channel: PotocuitChannels;
	declare type: InteractionType.MessageComponent;

	get customId() {
		return this.data.custom_id;
	}

	get componentType() {
		return this.data.component_type;
	}
}

export class SelectMenuInteraction extends ComponentInteraction {
	declare data: APIMessageComponentSelectMenuInteraction['data'];

	users?: User[];
	members?: InteractionGuildMember[];
	roles?: GuildRole[];
	channels?: PotocuitChannels[];

	constructor(
		rest: BiscuitREST,
		cache: Cache,
		interaction: APIMessageComponentSelectMenuInteraction,
	) {
		super(rest, cache, interaction);
		switch (this.componentType) {
			case ComponentType.ChannelSelect:
				{
					const resolved = (interaction.data as APIMessageChannelSelectInteractionData).resolved;
					this.channels = resolved.channels
						? this.values.map(x => BaseChannel.from(resolved.channels[x], this.rest, this.cache))
						: [];
					break;
				}
			case ComponentType.MentionableSelect:
				{
					const resolved = (interaction.data as APIMessageMentionableSelectInteractionData).resolved;
					this.roles = resolved.roles
						? this.values.map(x => new GuildRole(this.rest, this.cache, resolved.roles![x], this.guildId!))
						: [];
					this.members = resolved.members
						? this.values
							.map(x => new InteractionGuildMember(this.rest, this.cache, resolved.members![x], this.users!.find(u => u.id === x)!, this.guildId!))
						: [];
					this.users = resolved.users
						? this.values.map(x => new User(this.rest, this.cache, resolved.users![x]))
						: [];
					break;
				}
			case ComponentType.RoleSelect: {
				const resolved = (interaction.data as APIMessageRoleSelectInteractionData).resolved;
				this.roles = this.values.map(x => new GuildRole(this.rest, this.cache, resolved.roles[x], this.guildId!));
				break;
			}
			case ComponentType.UserSelect: {
				const resolved = (interaction.data as APIMessageUserSelectInteractionData).resolved;
				this.users = this.values.map(x => new User(this.rest, this.cache, resolved.users[x]));
				this.members = resolved.members
					? this.values
						.map(x => new InteractionGuildMember(this.rest, this.cache, resolved.members![x], this.users!.find(u => u.id === x)!, this.guildId!))
					: [];
				break;
			}
		}
	}

	get values() {
		return this.data.values;
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
}

export interface ChannelSelectMenuInteraction {
	channels: PotocuitChannels[];
	roles: never;
	members: never;
	users: never;
}

export interface MentionableSelectMenuInteraction {
	channels: never;
	roles: GuildRole[];
	members: InteractionGuildMember[];
	users: User[];
}

export interface RoleSelectMenuInteraction {
	channels: never;
	roles: GuildRole[];
	members: never;
	users: never;
}

export interface UserSelectMenuInteraction {
	channels: never;
	roles: never;
	members: InteractionGuildMember[];
	users: User[];
}

export class ChatInputCommandInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<FromGuild, APIChatInputApplicationCommandInteraction> {
	declare data: ObjectToLower<APIChatInputApplicationCommandInteractionData>;
}

export class UserCommandInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<FromGuild, APIUserApplicationCommandInteraction> {
	declare data: ObjectToLower<APIUserApplicationCommandInteractionData>;
}

export class MessageCommandInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<FromGuild, APIMessageApplicationCommandInteraction> {
	declare data: ObjectToLower<APIMessageApplicationCommandInteractionData>;
}

export class ModalSubmitInteraction<FromGuild extends boolean = boolean> extends Interaction<FromGuild, APIModalSubmitInteraction> {
	declare data: APIModalSubmission;
	get customId() {
		return this.data.custom_id;
	}

	get components() {
		return this.data.components;
	}
}
