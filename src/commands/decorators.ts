import type { LocaleString } from '@biscuitland/common';
import type { SubCommand, PotoCommandOption, MiddlewareContext, __PotoCommandOption, OptionsRecord } from './commands';

type DeclareOptions = {
	name: string;
	description: string;

	guildId?: string[];
	nsfw?: boolean;
};

export function Locales({ name: names, description: descriptions }: {
	name?: [language: LocaleString, value: string][];
	description?: [language: LocaleString, value: string][];
}) {
	return function <T extends { new(...args: any[]): {} }>(target: T) {
		return class extends target {
			name_localizations = names ? Object.fromEntries(names) : undefined;
			description_localizations = descriptions ? Object.fromEntries(descriptions) : undefined;
		};
	};
}

export function LocalesT(name: string, description: string) {
	return function <T extends { new(...args: any[]): {} }>(target: T) {
		return class extends target {
			__t = { name, description };
		};
	};
}

export function GroupsT(groups: Record<string/* name for group*/, {
	name: string;
	description: string;
	defaultDescription: string;
}>) {
	return function <T extends { new(...args: any[]): {} }>(target: T) {
		return class extends target {
			__tGroups = groups;
		};
	};
}

export function Groups(groups: Record<string/* name for group*/, {
	name?: [language: LocaleString, value: string][];
	description?: [language: LocaleString, value: string][];
	defaultDescription: string;
}>) {
	return function <T extends { new(...args: any[]): {} }>(target: T) {
		return class extends target {
			groups = groups;
		};
	};
}

export function Group(groupName: string) {
	return function <T extends { new(...args: any[]): {} }>(target: T) {
		return class extends target {
			group = groupName;
		};
	};
}

export function Options(options: (new () => SubCommand)[] | OptionsRecord) {
	return function <T extends { new(...args: any[]): {} }>(target: T) {
		return class extends target {
			options: SubCommand[] | PotoCommandOption[];
			constructor(...args: any[]) {
				super(...args);
				this.options = Array.isArray(options) ? options.map(x => new x()) : Object.entries(options).map(([name, option]) => {
					return {
						name,
						...option
					} as PotoCommandOption;
				});
			}
		};
	};
}

export function DynamicOptions() {
	return function <T extends { new(...args: any[]): {} }>(target: T) {
		return class extends target {
			__d = true;
		};
	};
}

export function Middlewares(cbs: Readonly<MiddlewareContext[]>) {
	return function <T extends { new(...args: any[]): {} }>(target: T) {
		return class extends target {
			middlewares = cbs;
		};
	};
}

export function Declare(declare: DeclareOptions) {
	return function <T extends { new(...args: any[]): {} }>(target: T) {
		return class extends target {
			name = declare.name;
			description = declare.description;
			nsfw = declare.nsfw;
			guild_id = declare.guildId;
			constructor(...args: any[]) {
				super(...args);
				// check if all properties are valid
			}
		};
	};
}
