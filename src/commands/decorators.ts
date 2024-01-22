import { ApplicationCommandType, PermissionFlagsBits, type LocaleString, type PermissionStrings } from '../common';
import type { CommandOption, OptionsRecord, SubCommand } from './applications/chat';
import type { MiddlewareContext } from './applications/shared';

type DeclareOptions =
	| {
			name: string;
			description: string;
			permissions?: PermissionStrings | bigint;
			defaultPermissions?: PermissionStrings | bigint;
			guildId?: string[];
			dm?: boolean;
			nsfw?: boolean;
	  }
	| (Omit<
			{
				name: string;
				description: string;
				permissions?: PermissionStrings | bigint;
				defaultPermissions?: PermissionStrings | bigint;
				guildId?: string[];
				dm?: boolean;
				nsfw?: boolean;
			},
			'type' | 'description'
	  > & {
			type: ApplicationCommandType.User | ApplicationCommandType.Message;
	  });

export function Locales({
	name: names,
	description: descriptions,
}: {
	name?: [language: LocaleString, value: string][];
	description?: [language: LocaleString, value: string][];
}) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			name_localizations = names ? Object.fromEntries(names) : undefined;
			description_localizations = descriptions ? Object.fromEntries(descriptions) : undefined;
		};
}

export function LocalesT(name: string, description: string) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			__t = { name, description };
		};
}

export function GroupsT(
	groups: Record<
		string /* name for group*/,
		{
			name: string;
			description: string;
			defaultDescription: string;
		}
	>,
) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			__tGroups = groups;
		};
}

export function Groups(
	groups: Record<
		string /* name for group*/,
		{
			name?: [language: LocaleString, value: string][];
			description?: [language: LocaleString, value: string][];
			defaultDescription: string;
		}
	>,
) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			groups = groups;
		};
}

export function Group(groupName: string) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			group = groupName;
		};
}

export function Options(options: (new () => SubCommand)[] | OptionsRecord) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			options: SubCommand[] | CommandOption[] = Array.isArray(options)
				? options.map(x => new x())
				: Object.entries(options).map(([name, option]) => {
						return {
							name,
							...option,
						} as CommandOption;
				  });
		};
}

export function AutoLoad() {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			__d = true;
		};
}

export function Middlewares(cbs: Readonly<MiddlewareContext[]>) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			middlewares = cbs;
		};
}

export function Declare(declare: DeclareOptions) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			name = declare.name;
			dm = !!declare.dm;
			nsfw = declare.nsfw;
			guild_id = declare.guildId;
			default_member_permissions = Array.isArray(declare.defaultPermissions)
				? declare.defaultPermissions?.reduce((acc, prev) => acc | PermissionFlagsBits[prev], BigInt(0)).toString()
				: declare.defaultPermissions;
			permissions = Array.isArray(declare.permissions)
				? declare.permissions?.reduce((acc, prev) => acc | PermissionFlagsBits[prev], BigInt(0))
				: declare.permissions;
			description = '';
			type: ApplicationCommandType = ApplicationCommandType.ChatInput;
			constructor(...args: any[]) {
				super(...args);
				if ('description' in declare) this.description = declare.description;
				if ('type' in declare) this.type = declare.type;
				// check if all properties are valid
			}
		};
}
