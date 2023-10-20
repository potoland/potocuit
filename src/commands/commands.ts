import type { APIApplicationCommandOption, LocaleString } from '@biscuitland/common';
import { ApplicationCommandOptionType, ApplicationCommandType } from '@biscuitland/common';

type DeclareOptions = {
	name: string;
	description: string;

	guildId?: string[];
	nsfw?: boolean;
};

type MiddlewareCallback = (context: any) => boolean;

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

export function Groups(groups: Record<string, {
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

export function Options(options: SubCommand[] | APIApplicationCommandOption[]) {
	return function <T extends { new(...args: any[]): {} }>(target: T) {
		return class extends target {
			options = options;
		};
	};
}

export function Middlewares(cbs: MiddlewareCallback[]) {
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

class BaseCommand {
	// y cambiarle el nombre a esta wea
	protected middlewares: MiddlewareCallback[] = [];

	__filePath?: string;

	name!: string;
	type!: number;// ApplicationCommandType.ChatInput | ApplicationCommandOptionType.Subcommand
	nsfw?: boolean;
	description!: string;
	// me gustaria hacer una forma de facilitar estas mierdas
	// los localizations terminan siendo objetos molestos de escribir y bastante largos
	// asi que hay que ir pensando una forma de mejorarlo
	//
	name_localizations?: Record<LocaleString, string>;
	description_localizations?: Record<LocaleString, string>;
	// esto es el raw bro
	// mira arriba
	options?: APIApplicationCommandOption[] | SubCommand[];


	toJSON() {
		return {
			name: this.name,
			type: this.type,
			nsfw: this.nsfw || false,
			description: this.description,
			name_localizations: this.name_localizations,
			description_localizations: this.description_localizations,
		};
	}
}

export class Command extends BaseCommand {
	type = ApplicationCommandType.ChatInput;

	groups?: Parameters<typeof Groups>[0];
	toJSON() {
		return {
			...super.toJSON(),
			options: this.options ? this.options.map(x => 'toJSON' in x ? x.toJSON() : x) : []
		};
	}
}

export class SubCommand extends BaseCommand {
	type = ApplicationCommandOptionType.Subcommand;
	group?: string;
	options?: APIApplicationCommandOption[];

	toJSON() {
		return {
			...super.toJSON(),
			options: this.options,
		};
	}
}

// idea:
/*

@Declare({ name: 'ping' ... })
class Ping extends Command {}

@Declare({ name: 'admin' ... })
@Options([Request])
class Admin extends Command {}

@Declare({ name: 'request' ... })
@Middlewares([CheckIfAdmin])
@Group('setup', 'setup description')
class Request extends SubCommand {}

/ping

/admin setup request
*/

// ta bueno
// xdddddddddddddddddddd god.


@Declare({
	name: 'set',
	description: 'set value'
})
@Group('setup')
class SetValue extends SubCommand { }

@Declare({
	description: 'Check bot ping',
	name: 'ping',
	nsfw: true
})
// xdd
// justo para evitar esto es que digo lo del langs dasjdasdjdksa imaginate este objeto con 15 traducciones
@Locales({
	description: [
		['es-ES', 'Mira la latencia del bot'],
	],
	name: [
		['es-ES', 'latencia']
	]
})
@Middlewares([(int: any) => int.isAdmin])
// como mrd hago que no se tenga que declarar las descripciones cada vez
// a? contexto pues no se que tan bien sean los decorators, pero tecnicamente el de la description llego primero asi que ya deberia existir en la clase
// pero el declare nmo tiene que ver con el Group
// entonces no se, como dices son cosas separadas asi que no le veo una forma XD
@Groups({
	setup: {
		name: [['es-ES', 'xd']],
		description: [['es-ES', 'ddxd']],
		defaultDescription: 'xdddddd'
	}
})
@Options([new SetValue])
// aya hago un @Groups para el comando base na q genio
class Admin extends BaseCommand {

}

new Admin();

// q
// sisi al rato priemro quiero que prenda
// ahora pensandolo, mejor intengremos una clase like in18
// que le metamos un sistema de traducion nativamente sdasdjksdas
