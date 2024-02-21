import { ApplicationCommandType, PermissionFlagsBits, type LocaleString, type PermissionStrings } from '../common';
import type { CommandOption, OptionsRecord, SubCommand } from './applications/chat';
import type { DefaultLocale, MiddlewareContext } from './applications/shared';

export interface RegisteredMiddlewares { }

type DeclareOptions =
	| {
		name: string;
		description: string;
		botPermissions?: PermissionStrings | bigint;
		defaultPermissions?: PermissionStrings | bigint;
		guildId?: string[];
		dm?: boolean;
		nsfw?: boolean;
	}
	| (Omit<
		{
			name: string;
			description: string;
			botPermissions?: PermissionStrings | bigint;
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
	return <T extends { new(...args: any[]): {} }>(target: T) =>
		class extends target {
			name_localizations = names ? Object.fromEntries(names) : undefined;
			description_localizations = descriptions ? Object.fromEntries(descriptions) : undefined;
		};
}

export function LocalesT(name?: FlatObjectKeys<DefaultLocale>, description?: FlatObjectKeys<DefaultLocale>) {
	return <T extends { new(...args: any[]): {} }>(target: T) =>
		class extends target {
			__t = { name, description };
		};
}

export function GroupsT(
	groups: Record<
		string /* name for group*/,
		{
			name?: FlatObjectKeys<DefaultLocale>;
			description?: FlatObjectKeys<DefaultLocale>;
			defaultDescription: string;
		}
	>,
) {
	return <T extends { new(...args: any[]): {} }>(target: T) =>
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
	return <T extends { new(...args: any[]): {} }>(target: T) =>
		class extends target {
			groups = groups;
		};
}

export function Group(groupName: string) {
	return <T extends { new(...args: any[]): {} }>(target: T) =>
		class extends target {
			group = groupName;
		};
}

export function Options(options: (new () => SubCommand)[] | OptionsRecord) {
	return <T extends { new(...args: any[]): {} }>(target: T) =>
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
	return <T extends { new(...args: any[]): {} }>(target: T) =>
		class extends target {
			__d = true;
		};
}

export type ParseMiddlewares<T extends Record<string, MiddlewareContext>> = {
	[k in keyof T]: T[k];
};

export function Middlewares(cbs: readonly (keyof RegisteredMiddlewares)[]) {
	return <T extends { new(...args: any[]): {} }>(target: T) =>
		class extends target {
			middlewares = cbs;
		};
}

export function Declare(declare: DeclareOptions) {
	return <T extends { new(...args: any[]): {} }>(target: T) =>
		class extends target {
			name = declare.name;
			dm = !!declare.dm;
			nsfw = declare.nsfw;
			guild_id = declare.guildId;
			default_member_permissions = Array.isArray(declare.defaultPermissions)
				? declare.defaultPermissions?.reduce((acc, prev) => acc | PermissionFlagsBits[prev], BigInt(0)).toString()
				: declare.defaultPermissions;
			botPermissions = Array.isArray(declare.botPermissions)
				? declare.botPermissions?.reduce((acc, prev) => acc | PermissionFlagsBits[prev], BigInt(0))
				: declare.botPermissions;
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

export type FlatObjectKeys<T extends Record<string, any>, Key = keyof T> = Key extends string
	? T[Key] extends Record<string, unknown>
	? `${Key}.${FlatObjectKeys<T[Key]>}`
	: T[Key] extends string ? `${Key}`
	: never
	: never;
