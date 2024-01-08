import { ApplicationCommandType, type LocaleString, PermissionFlagsBits, type PermissionStrings } from '../common';
import type { OptionsRecord, PotoCommandOption, SubCommand } from './applications/chat';
import type { MiddlewareContext } from './applications/shared';

type DeclareOptions =
	| {
			name: string;
			description: string;
			permissions?: PermissionStrings;
			defaultPermissions?: PermissionStrings;
			guildId?: string[];
			dm?: boolean;
			nsfw?: boolean;
	  }
	| (Omit<
			{
				name: string;
				description: string;
				permissions?: PermissionStrings;
				defaultPermissions?: PermissionStrings;
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
			options: SubCommand[] | PotoCommandOption[] = Array.isArray(options)
				? options.map(x => new x())
				: Object.entries(options).map(([name, option]) => {
						return {
							name,
							...option,
						} as PotoCommandOption;
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
			nsfw = declare.nsfw;
			guild_id = declare.guildId;
			default_member_permissions = declare.defaultPermissions
				?.reduce((acc, prev) => acc | PermissionFlagsBits[prev], BigInt(0))
				.toString();
			permissions = declare.permissions?.reduce((acc, prev) => acc | PermissionFlagsBits[prev], BigInt(0));
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
