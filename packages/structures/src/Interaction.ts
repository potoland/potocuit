import type {
	APIApplicationCommandAutocompleteInteraction,
	APIApplicationCommandAutocompleteResponse,
	APIApplicationCommandInteractionDataSubcommandGroupOption,
	APIApplicationCommandInteractionDataSubcommandOption,
	APIChatInputApplicationCommandInteraction,
	APIContextMenuInteraction,
	APIInteraction,
	APIInteractionDataResolved,
	APIInteractionResponsePong,
	APIMessageChannelSelectInteractionData,
	APIMessageComponentInteraction,
	APIMessageComponentSelectMenuInteraction,
	APIMessageMentionableSelectInteractionData,
	APIMessageRoleSelectInteractionData,
	APIMessageUserSelectInteractionData, APIModalSubmitInteraction,
	APIPingInteraction,
	InteractionType,
	LocaleString,
	RESTPatchAPIWebhookWithTokenMessageJSONBody,
	RESTPostAPIInteractionCallbackJSONBody,
	RESTPostAPIInteractionFollowupJSONBody
} from '@biscuitland/common';
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ComponentType
} from '@biscuitland/common';
import type { BiscuitREST, RawFile } from '@biscuitland/rest';
import type { BiscuitChannels } from './miscellaneous';
import type { Cache } from './cache';
import { channelFactory } from './miscellaneous';
import { GuildMember, InteractionGuildMember } from './GuildMember';
import { Role } from './GuildRole';
import { Message } from './Message';
import { User } from './User';
import { Base } from './extra/Base';

export class BaseInteraction extends Base {
	id: string;
	token: string;
	applicationId: string;
	type: InteractionType;
	version: number;
	constructor(rest: BiscuitREST, cache: Cache, interaction: APIInteraction) {
		super(rest, cache);
		this.id = interaction.id;
		this.token = interaction.token;
		this.applicationId = interaction.application_id;
		this.type = interaction.type;
		this.version = interaction.version;
	}

	reply(body: Exclude<RESTPostAPIInteractionCallbackJSONBody, APIInteractionResponsePong>, files?: RawFile[]) {
		return this.api.interactions(this.id)(this.token).callback.post({
			body,
			files,
		});
	}
}

export class Interaction extends BaseInteraction {
	user: User;
	member?: GuildMember;
	appPermissions?: string;
	channel?: BiscuitChannels;
	guildId?: string;
	guildLocale?: LocaleString;
	locale: LocaleString;
	constructor(
		rest: BiscuitREST,
		cache: Cache,
		interaction: Exclude<APIInteraction, APIPingInteraction>,
	) {
		super(rest, cache, interaction);
		if (interaction.member) {
			this.member = new GuildMember(
				rest,
				cache,
				interaction.member,
				interaction.member?.user ?? interaction.user!,
				interaction.guild_id!,
			);
		}
		this.user =
			this.member?.user ??
			new User(rest, cache, interaction.member?.user ?? interaction.user!);
		if ('app_permissions' in interaction) {
			this.appPermissions = interaction.app_permissions;
		}
		if (interaction.channel) {
			this.channel = channelFactory(rest, cache, interaction.channel);
		}
		if (interaction.guild_id) {
			this.guildId = interaction.guild_id;
		}
		if (interaction.guild_locale) {
			this.guildLocale = interaction.guild_locale;
		}
		this.locale = interaction.locale;
	}

	getResponse(messageId = '@original') {
		return this.api
			.webhooks(this.applicationId)(this.token)
			.messages(messageId)
			.get();
	}

	editResponse(
		body: RESTPatchAPIWebhookWithTokenMessageJSONBody,
		files?: RawFile[],
		messageId = '@original',
	) {
		return this.api
			.webhooks(this.applicationId)(this.token)
			.messages(messageId)
			.patch({
				body,
				files,
			});
	}

	deleteResponse(messageId = '@original') {
		return this.api
			.webhooks(this.applicationId)(this.token)
			.messages(messageId)
			.delete();
	}

	followUp(body: RESTPostAPIInteractionFollowupJSONBody, files?: RawFile[]) {
		return this.api.webhooks(this.applicationId)(this.token).post({
			body,
			files,
			query: {},
		});
	}
}

export class ContextMenuInteraction extends Interaction {
	declare type: InteractionType.ApplicationCommand;
	data: APIContextMenuInteraction['data'];

	constructor(
		rest: BiscuitREST,
		cache: Cache,
		interaction: APIContextMenuInteraction,
	) {
		super(rest, cache, interaction);
		this.data = interaction.data;
	}

	get resolved() {
		return (this.data.resolved ?? {});
	}

	get target(): unknown {
		if ('messages' in this.resolved) {
			return new Message(this.rest, this.cache, this.resolved.messages[this.targetId]);
		}
		return this.resolved.members
			? new InteractionGuildMember(
				this.rest,
				this.cache,
				this.resolved.members[this.targetId],
				this.resolved.users[this.targetId],
				this.guildId!
			)
			: new User(this.rest, this.cache, this.resolved.users[this.targetId]);
	}

	get targetId() {
		return this.data.target_id;
	}

	get commandId() {
		return this.data.id;
	}

	get commandName() {
		return this.data.name;
	}

	get commandType() {
		return this.data.type;
	}

	isContextUserMenu(): this is ContextUserMenuInteraction {
		return this.commandType === ApplicationCommandType.User;
	}

	isContextMessageMenu(): this is ContextMessageMenuInteraction {
		return this.commandType === ApplicationCommandType.Message;
	}
}

export interface ContextMessageMenuInteraction {
	get target(): Message;
}

export interface ContextUserMenuInteraction {
	get target(): User | InteractionGuildMember;
}

export class AutocompleteInteraction extends Interaction {
	data: APIApplicationCommandAutocompleteInteraction['data'];
	constructor(
		rest: BiscuitREST,
		cache: Cache,
		interaction: APIApplicationCommandAutocompleteInteraction,
	) {
		super(rest, cache, interaction);
		this.data = interaction.data;
	}

	get resolved() {
		return (this.data.resolved ?? {}) as APIInteractionDataResolved;
	}

	get options() {
		let options = this.data.options ?? [];
		while (options.some(x => [ApplicationCommandOptionType.Subcommand, ApplicationCommandOptionType.SubcommandGroup].includes(x.type))) {
			options = (options[0] as APIApplicationCommandInteractionDataSubcommandOption | APIApplicationCommandInteractionDataSubcommandGroupOption).options ?? [];
		}
		return options;
	}

	get commandId() {
		return this.data.id;
	}

	get commandName() {
		return this.data.name;
	}

	get commandType() {
		return this.data.type;
	}

	reply(body: APIApplicationCommandAutocompleteResponse, _files: never) {
		return super.reply(body);
	}
}

export class ChatInputInteraction extends Interaction {
	data: APIChatInputApplicationCommandInteraction['data'];
	declare appPermissions: string;
	declare channel: BiscuitChannels;
	constructor(
		rest: BiscuitREST,
		cache: Cache,
		interaction: APIChatInputApplicationCommandInteraction,
	) {
		super(rest, cache, interaction);
		this.data = interaction.data;
	}

	get resolved() {
		return (this.data.resolved ?? {}) as APIInteractionDataResolved;
	}

	get options() {
		let options = this.data.options ?? [];
		while (options.some(x => [ApplicationCommandOptionType.Subcommand, ApplicationCommandOptionType.SubcommandGroup].includes(x.type))) {
			options = (options[0] as APIApplicationCommandInteractionDataSubcommandOption | APIApplicationCommandInteractionDataSubcommandGroupOption).options ?? [];
		}
		return options;
	}

	get commandId() {
		return this.data.id;
	}

	get commandName() {
		return this.data.name;
	}

	get commandType() {
		return this.data.type;
	}
}

export class ComponentInteraction extends Interaction {
	data: APIMessageComponentInteraction['data'];
	message: Message;
	declare appPermissions: string;
	declare channel: BiscuitChannels;
	constructor(
		rest: BiscuitREST,
		cache: Cache,
		interaction: APIMessageComponentInteraction,
	) {
		super(rest, cache, interaction);
		this.data = interaction.data;
		this.message = new Message(rest, cache, interaction.message);
	}

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
	roles?: Role[];
	channels?: BiscuitChannels[];

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
						? this.values.map(x => channelFactory(this.rest, this.cache, resolved.channels[x]))
						: [];
					break;
				}
			case ComponentType.MentionableSelect:
				{
					const resolved = (interaction.data as APIMessageMentionableSelectInteractionData).resolved;
					this.roles = resolved.roles
						? this.values.map(x => new Role(this.rest, this.cache, resolved.roles![x], this.guildId!))
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
				this.roles = this.values.map(x => new Role(this.rest, this.cache, resolved.roles[x], this.guildId!));
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
	channels: BiscuitChannels[];
	roles: never;
	members: never;
	users: never;
}

export interface MentionableSelectMenuInteraction {
	channels: never;
	roles: Role[];
	members: InteractionGuildMember[];
	users: User[];
}

export interface RoleSelectMenuInteraction {
	channels: never;
	roles: Role[];
	members: never;
	users: never;
}

export interface UserSelectMenuInteraction {
	channels: never;
	roles: never;
	members: InteractionGuildMember[];
	users: User[];
}

export class ModalSubmitInteraction extends Interaction {
	data: APIModalSubmitInteraction['data'];
	constructor(
		rest: BiscuitREST,
		cache: Cache,
		interaction: APIModalSubmitInteraction,
	) {
		super(rest, cache, interaction);
		this.data = interaction.data;
	}

	get customId() {
		return this.data.custom_id;
	}

	get components() {
		return this.data.components;
	}
}
