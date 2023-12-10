import type { LocaleString } from '@biscuitland/common';
import type { SubCommand, PotoCommandOption, MiddlewareContext, OptionsRecord } from './commands';
import type { BaseClient } from '../client/base';

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

export function Options(options: (new (client: BaseClient) => SubCommand)[] | OptionsRecord) {
	return function <T extends { new(...args: any[]): {} }>(target: T) {
		return class extends target {
			client!: BaseClient;
			// options = options;
			options: SubCommand[] | PotoCommandOption[];
			constructor(...args: any[]) {
				super(...args);
				this.options = Array.isArray(options) ? options.map(x => new x(this.client)) : Object.entries(options).map(([name, option]) => {
					return {
						name,
						...option
					} as PotoCommandOption;
				});
			}
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
// no hablo python
// weno
// Y si en localizations usamos una tupla en vez de un objeto?
// en vez de { "es-ES": "dsadad"} haces [["es-Es", dasdda]...]
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
