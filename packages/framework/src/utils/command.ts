import type {
	DiscordApplicationCommandOption,
	DiscordInteractionData, DiscordInteractionDataOption,
	DiscordInteraction, Locales, DiscordAttachment, DiscordChannel, DiscordInteractionMember, DiscordRole, DiscordUser
} from '@biscuitland/api-types';
import {
	ApplicationCommandOptionTypes,
	ApplicationCommandTypes,
} from '@biscuitland/api-types';
import type {
	ApplicationCommandInteraction, AutocompleteInteraction,
	ContextMenuMessageInteraction, ContextMenuUserInteraction,
	Interaction
} from '../structures';

interface BaseCommand {
	name: string;
	name_localizations?: Partial<Record<Locales, string>>;
	description: string;
	description_localizations?: Partial<Record<Locales, string>>;
	options: (SubGroupCommand | SubCommand | DiscordApplicationCommandOption)[];
	type: ApplicationCommandTypes | ApplicationCommandOptionTypes;
	guild_id?: string;
}

class BaseCommand {
	constructor(data?: Omit<BaseCommand, 'getInvoker' | 'getInvokerOption'>) {
		this.__metadata__ = data?.__metadata__ ?? this.__metadata__;
		this.description = data?.description ?? this.description;
		this.description_localizations = data?.description_localizations ?? this.description_localizations;
		this.guild_id = data?.guild_id ?? data?.guild_id;
		this.name = data?.name ?? this.name;
		this.name_localizations = data?.name_localizations ?? this.name_localizations;
		this.nsfw = data?.nsfw ?? this.nsfw;
		this.onAutocomplete = data?.onAutocomplete.bind(this) ?? this.onAutocomplete;
		this.onError = data?.onError.bind(this) ?? this.onError;
		this.options = data?.options ?? this.options;
		this.run = data?.run.bind(this) ?? this.run;
		this.type = data?.type ?? this.type;
	}

	__metadata__: Record<string, any> = {};
	nsfw = false;
	getInvoker(data: DiscordInteractionData | DiscordInteractionDataOption): { invoker: SubCommand | Command | null; options: DiscordInteractionDataOption[] } {
		if (data.name === this.name) {
			if (data.options?.find(x => x.type === ApplicationCommandOptionTypes.SubCommand || x.type === ApplicationCommandOptionTypes.SubCommandGroup)) {
				return this.getInvokerOption(data.options!);
			}
			return { invoker: this, options: data.options ?? [] };
		}
		return { invoker: null, options: [] };
	}

	getInvokerOption(rawOptions: DiscordInteractionDataOption[]): { invoker: SubCommand | Command | null; options: DiscordInteractionDataOption[] } {
		const options = this.options;
		const cmd = options.find(x => x.name === rawOptions[0].name) as SubCommand | SubGroupCommand;
		if (cmd) { return cmd.getInvoker(rawOptions[0]); }
		return { invoker: null, options: [] };
	}

	run(_interaction: ApplicationCommandInteraction | ContextMenuMessageInteraction | ContextMenuUserInteraction): any {
		return;
	}


	onAutocomplete(_interaction: AutocompleteInteraction, _focused: DiscordInteractionDataOption): any {
		return;
	}

	onError(_interaction: Interaction, _error: unknown): any {
		return;
	}
}

export interface Command {
	options: (SubGroupCommand | SubCommand | DiscordApplicationCommandOption)[];
}

export class Command extends BaseCommand {
	type = ApplicationCommandTypes.ChatInput;

	run(_interaction: ApplicationCommandInteraction): any {
		return;
	}
}

export interface ContextMenu {
	description: never;
	// type: ContextMenuTypes;
}

export class ContextMenu extends BaseCommand {
	type: ApplicationCommandTypes = ApplicationCommandTypes.User;

	run(_interaction: ContextMenuUserInteraction | ContextMenuMessageInteraction): any {
		return;
	}
}

export interface SubCommand {
	options: SubCommand[] | DiscordApplicationCommandOption[];
}

export class SubCommand extends BaseCommand {
	type = ApplicationCommandOptionTypes.SubCommand;

	run(_interaction: ApplicationCommandInteraction): any {
		return;
	}
}

export interface SubGroupCommand {
	options: (SubGroupCommand | SubCommand)[];
}

export class SubGroupCommand extends BaseCommand {
	type = ApplicationCommandOptionTypes.SubCommandGroup;
}

export class OptionsContext {
	constructor(private data: DiscordInteraction, private options: DiscordInteractionDataOption[]) {

	}

	getString(name: string, required?: false): string | undefined;
	getString(name: string, required: true): string;
	getString(name: string, required = false) {
		const value = this.options.find(x =>
			x.name === name
			&&
			x.type === ApplicationCommandOptionTypes.String
		);
		if (!value && required) {
			throw new Error('Required value');
		}
		return value ? value.value as string : value;
	}

	getInteger(name: string, required?: false): number | undefined;
	getInteger(name: string, required: true): number;
	getInteger(name: string, required = false) {
		const value = this.options.find(x =>
			x.name === name
			&&
			x.type === ApplicationCommandOptionTypes.Integer
		);
		if (!value && required) {
			throw new Error('Required value');
		}
		return value ? value.value as number : value;
	}

	getBoolean(name: string, required?: false): boolean | undefined;
	getBoolean(name: string, required: true): boolean;
	getBoolean(name: string, required = false) {
		const value = this.options.find(x =>
			x.name === name
			&&
			x.type === ApplicationCommandOptionTypes.Boolean
		);
		if (!value && required) {
			throw new Error('Required value');
		}
		return value ? value.value as boolean : value;
	}

	getUser(name: string, required?: false): DiscordUser | undefined;
	getUser(name: string, required: true): DiscordUser;
	getUser(name: string, required = false) {
		const value = this.options.find(x =>
			x.name === name
			&&
			(x.type === ApplicationCommandOptionTypes.User || x.type === ApplicationCommandOptionTypes.Mentionable)
		);
		if (!value && required) {
			throw new Error('Required value');
		}
		return value
			? this.data.data!.resolved?.users
				? this.data.data!.resolved.users![value.value as string]
				: undefined
			: value;
	}

	getMember(name: string, required?: false): Omit<DiscordInteractionMember, 'user' | 'deaf' | 'mute'> | undefined;
	getMember(name: string, required: true): Omit<DiscordInteractionMember, 'user' | 'deaf' | 'mute'>;
	getMember(name: string, required = false) {
		const value = this.options.find(x =>
			x.name === name
			&&
			(x.type === ApplicationCommandOptionTypes.User || x.type === ApplicationCommandOptionTypes.Mentionable)
		);
		if (!value && required) {
			throw new Error('Required value');
		}
		return value
			? this.data.data!.resolved?.members
				? this.data.data!.resolved.members![value.value as string]
				: undefined
			: value;
	}

	getChannel(name: string, required?: false): Pick<DiscordChannel, 'permissions' | 'id' | 'name' | 'type' | 'thread_metadata' | 'parent_id'> | undefined;
	getChannel(name: string, required: true): Pick<DiscordChannel, 'permissions' | 'id' | 'name' | 'type' | 'thread_metadata' | 'parent_id'>;
	getChannel(name: string, required = false) {
		const value = this.options.find(x =>
			x.name === name
			&&
			x.type === ApplicationCommandOptionTypes.Channel
		);
		if (!value && required) {
			throw new Error('Required value');
		}
		return value
			? this.data.data!.resolved?.channels
				? this.data.data!.resolved.channels![value.value as string]
				: undefined
			: value;
	}

	getRole(name: string, required?: false): DiscordRole | undefined;
	getRole(name: string, required: true): DiscordRole;
	getRole(name: string, required = false) {
		const value = this.options.find(x =>
			x.name === name
			&&
			(x.type === ApplicationCommandOptionTypes.Role || x.type === ApplicationCommandOptionTypes.Mentionable)
		);
		if (!value && required) {
			throw new Error('Required value');
		}
		return value
			? this.data.data!.resolved?.roles
				? this.data.data!.resolved.roles![value.value as string]
				: undefined
			: value;
	}

	getMentionable(name: string, required?: false): DiscordRole | Omit<DiscordInteractionMember, 'user' | 'deaf' | 'mute'> | undefined;
	getMentionable(name: string, required: true): DiscordRole | Omit<DiscordInteractionMember, 'user' | 'deaf' | 'mute'>;
	getMentionable(name: string, required = false) {
		const value = this.options.find(x =>
			x.name === name
			&&
			x.type === ApplicationCommandOptionTypes.Mentionable
		);
		if (!value && required) {
			throw new Error('Required value');
		}
		return value
			? this.data.data!.resolved
				? (
					this.data.data!.resolved.members?.[value.value as string]
					|| this.data.data!.resolved.users?.[value.value as string]
					|| this.data.data!.resolved.roles?.[value.value as string]
				)
				: undefined
			: value;
	}

	getNumber(name: string, required?: false): number | undefined;
	getNumber(name: string, required: true): number;
	getNumber(name: string, required = false) {
		const value = this.options.find(x =>
			x.name === name
			&&
			x.type === ApplicationCommandOptionTypes.Number
		);
		if (!value && required) {
			throw new Error('Required value');
		}
		return value ? value.value as number : value;
	}

	getAttachment(name: string, required?: false): DiscordAttachment | undefined;
	getAttachment(name: string, required: true): DiscordAttachment;
	getAttachment(name: string, required = false) {
		const value = this.options.find(x =>
			x.name === name
			&&
			x.type === ApplicationCommandOptionTypes.Attachment
		);
		if (!value && required) {
			throw new Error('Required value');
		}
		return value
			? this.data.data!.resolved?.attachments
				? this.data.data!.resolved.attachments![value.value as string]
				: undefined
			: value;
	}
}
