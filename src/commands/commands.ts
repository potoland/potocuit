import type { APIApplicationCommandBasicOption, APIApplicationCommandOption, APIApplicationCommandSubcommandGroupOption, APIAttachment, APIInteractionResponseChannelMessageWithSource, LocaleString, RESTPatchAPIWebhookWithTokenMessageJSONBody } from '@biscuitland/common';
import { ApplicationCommandOptionType, ApplicationCommandType, InteractionResponseType } from '@biscuitland/common';
import type { AutocompleteInteraction, ChatInputCommandInteraction } from '../structures/Interaction';
import type { RawFile } from '@biscuitland/rest';
import { Router } from '@biscuitland/rest';
import type { User } from '../structures/User';
import type { PotocuitChannels } from '../structures/channels';
import type { GuildRole } from '../structures/GuildRole';
import type { Result } from '../types/util';
import type { OptionResolver } from './handler';
import type { InteractionGuildMember } from '../structures/GuildMember';
import type { __LangType } from '../__generated';
import type { BaseClient } from '../client/base';

export class CommandContext<T extends PotoCommandOption[], M extends Readonly<MiddlewareContext[]>> {
	constructor(private client: BaseClient, private interaction: ChatInputCommandInteraction, public options: ContextOptions<{ options: T }>, public metadata: CommandMetadata<M>, public resolver: OptionResolver) { }

	private __router__ = new Router(this.interaction.rest);

	get proxy() {
		return this.__router__.createProxy();
	}

	t<K extends keyof __LangType>(message: K, metadata: __LangType[K]) {
		return this.client.langs.get(this.interaction.locale, message, metadata);
	}

	write(body: APIInteractionResponseChannelMessageWithSource['data'], files: RawFile[] = []) {
		return this.interaction.reply(
			{
				data: body,
				type: InteractionResponseType.ChannelMessageWithSource
			},
			files,
		);
	}

	deleteResponse() {
		return this.interaction.deleteResponse();
	}

	editResponse(body: RESTPatchAPIWebhookWithTokenMessageJSONBody, files?: RawFile[]) {
		return this.interaction.editResponse(body, files);
	}

	fetchResponse() {
		return this.interaction.fetchResponse();
	}

	get author() {
		return this.interaction.user;
	}

	get member() {
		return this.interaction.member;
	}
}

type DeclareOptions = {
	name: string;
	description: string;

	guildId?: string[];
	nsfw?: boolean;
};

interface ReturnOptionsTypes {
	1: never;// subcommand
	2: never;// subcommandgroup
	3: string;
	4: number;// integer
	5: boolean;
	6: InteractionGuildMember | User;
	7: PotocuitChannels;
	8: GuildRole;
	9: GuildRole | PotocuitChannels | User;
	10: number;// number
	11: APIAttachment;
}

type Wrap<N extends ApplicationCommandOptionType> = N extends ApplicationCommandOptionType.Subcommand | ApplicationCommandOptionType.SubcommandGroup ? never : ({
	type: N;
	required: false;
	value(value: ReturnOptionsTypes[N] | undefined, ok: OKFunction<any>, fail: FailFunction): void;
} | {
	type: N;
	required: true;
	value(value: ReturnOptionsTypes[N], ok: OKFunction<any>, fail: FailFunction): void;
}) & Omit<APIApplicationCommandBasicOption, 'type' | 'required'>;
type __TypesWrapper = {
	[P in keyof typeof ApplicationCommandOptionType]: `${typeof ApplicationCommandOptionType[P]}` extends `${infer D extends number}` ? Wrap<D> : never;
};

export type OKFunction<T> = (value: T) => void;
export type FailFunction = (value: Error) => void;
export type StopFunction = (error: Error) => void;
export type NextFunction<T> = (data: T) => void;
export type AutocompleteCallback = (interaction: AutocompleteInteraction) => any;
export type PotoCommandBaseOption = __TypesWrapper[keyof __TypesWrapper];
export type PotoCommandAutocompleteOption = Extract<__TypesWrapper[keyof __TypesWrapper] & { autocomplete: AutocompleteCallback }, { type: ApplicationCommandOptionType.String | ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number }>;
export type PotoCommandOption = PotoCommandBaseOption | PotoCommandAutocompleteOption;
// thanks yuzu & socram
export type ContextOptions<T extends { options: PotoCommandOption[] }> = {
	[K in T['options'][number]['name']]: Parameters<Parameters<Extract<T['options'][number], { name: K }>['value']>[1]>[0];// ApplicationCommandOptionType[];
};
export type MiddlewareContext<T = any> = (context: { lastFail: Error | undefined; cmdContext: CommandContext<[], []>; next: NextFunction<T>; fail: FailFunction; stop: StopFunction }) => any;
export type MetadataMiddleware<T extends MiddlewareContext> = Parameters<Parameters<T>[0]['next']>[0];
export type CommandMetadata<T extends Readonly<MiddlewareContext[]>> = T extends readonly [infer first, ...infer rest]
	? first extends MiddlewareContext
	? MetadataMiddleware<first> & (rest extends MiddlewareContext[] ? CommandMetadata<rest> : {})
	: {}
	: {};

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

export function Options(options: SubCommand[] | PotoCommandOption[]) {
	return function <T extends { new(...args: any[]): {} }>(target: T) {
		return class extends target {
			options = options;
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

type OnOptionsReturnObject = Record<string, {
	failed: false;
	value: any;
} | {
	failed: true;
	value: Error;
}>;

class BaseCommand {
	// y cambiarle el nombre a esta wea
	protected middlewares: MiddlewareContext[] = [];

	__filePath?: string;
	__t?: { name: string; description: string };

	name!: string;
	type!: number;// ApplicationCommandType.ChatInput | ApplicationCommandOptionType.Subcommand
	nsfw?: boolean;
	description!: string;
	// me gustaria hacer una forma de facilitar estas mierdas
	// los localizations terminan siendo objetos molestos de escribir y bastante largos
	// asi que hay que ir pensando una forma de mejorarlo
	//
	name_localizations?: Partial<Record<LocaleString, string>>;
	description_localizations?: Partial<Record<LocaleString, string>>;
	// esto es el raw bro
	// mira arriba
	options?: PotoCommandOption[] | SubCommand[];

	onStop(context: CommandContext<[], []>, error: Error) {
		return context.write({
			content: `Oops, it seems like something didn't go as expected:\n\`\`\`${error.message}\`\`\``
		});
	}

	onRunOptionsError(context: CommandContext<[], []>, metadata: OnOptionsReturnObject) {
		let content = '';
		for (const i in metadata) {
			const err = metadata[i];
			if (err.failed) { content += `[${i}]: ${err.value.message}\n`; }
		}

		return context.write({
			content
		});
	}

	async runOptions(ctx: CommandContext<[], []>, resolver: OptionResolver): Promise<[boolean, OnOptionsReturnObject]> {
		const command = resolver.getCommand();
		if (!resolver.hoistedOptions.length || !command) { return [false, {}]; }
		const data: OnOptionsReturnObject = {};
		let errored = false;
		for (const i of resolver.hoistedOptions) {
			const option = command.options!.find(x => x.name === i.name) as PotoCommandOption;
			const value = await new Promise(resolve => option.value(resolver.getValue(i.name) as never, resolve, resolve)) as any | Error;
			if (value instanceof Error) {
				errored = true;
				data[i.name] = {
					failed: true,
					value
				};
				continue;
			}
			if (!value) {
				if (option.required) {
					errored = true;
					data[i.name] = {
						failed: true,
						value: new Error(`${i.name} is required but returned no value`),
					};
					continue;
				}
			}
			// @ts-expect-error
			ctx.options[i.name] = value;
			data[i.name] = {
				failed: false,
				value
			};
		}

		return [errored, data];
	}

	// dont fucking touch.
	runMiddlewares(context: CommandContext<[], []>): Result<Record<string, any>, true> {
		if (!this.middlewares.length) { return Promise.resolve([{}, undefined]); }// nose nunca he hecho middlewares xdxd
		// hay que pensarse mejor el next, capaz usando promesas para el callback
		// se supone que el next tiene que devolver algo o nada, lo mas cercano a eso es un resolve() o directamente otro callback
		// principalmente por tema de index y el lastFail tambien esta jodido yo me voy a cenar, seguimos mañana
		// voy a bañarme B)
		const metadata: Record<string, any> = {};
		let index = 0,
			lastFail: Error | undefined;

		return new Promise(res => {
			// I dont think this is needed, but just in case
			let timeoutCleared = false;
			const timeout = setTimeout(() => {
				timeoutCleared = true;
				res([undefined, new Error('Timeout middlewares')]);
				// 2.8 seconds
			}, 2.8e3);
			const next: NextFunction<any> = obj => {
				if (timeoutCleared) { return; }
				Object.assign(metadata, obj);
				if (++index >= this.middlewares.length) {
					context.metadata = metadata;
					timeoutCleared = true;
					clearTimeout(timeout);
					return res([metadata, undefined]);
				}
				this.middlewares[index]({ lastFail, cmdContext: context, next, fail, stop });
			};
			const fail: FailFunction = err => {
				if (timeoutCleared) { return; }
				lastFail = err;
				if (++index >= this.middlewares.length) {
					context.metadata = metadata;
					timeoutCleared = true;
					clearTimeout(timeout);
					return res([metadata, undefined]);
				}
				this.middlewares[index]({ lastFail, cmdContext: context, next, fail, stop });
			};
			const stop: StopFunction = err => {
				if (timeoutCleared) { return; }
				lastFail = err;
				return res([undefined, err]);
			};
			this.middlewares[0]({ lastFail, cmdContext: context, next, fail, stop });
		});
	}

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

	async reload() {
		delete require.cache[this.__filePath!];
		const newCommand = await import(this.__filePath!).then(x => x.default ?? x);
		Object.setPrototypeOf(this, newCommand.prototype);
	}

	run?(context: CommandContext<any, any>): any;
}

export class Command extends BaseCommand {
	type = ApplicationCommandType.ChatInput;

	groups?: Parameters<typeof Groups>[0];
	toJSON() {
		const options: APIApplicationCommandOption[] = [];

		for (const i of this.options ?? []) {
			if (!(i instanceof SubCommand)) {
				options.push(({ ...i, autocomplete: 'autocomplete' in i }) as APIApplicationCommandBasicOption);
				continue;
			}
			if (i.group) {
				if (!options.find(x => x.name === i.group)) {
					options.push({
						type: ApplicationCommandOptionType.SubcommandGroup,
						name: i.group,
						description: this.groups![i.group].defaultDescription,
						description_localizations: Object.fromEntries(this.groups?.[i.group].description ?? []),
						name_localizations: Object.fromEntries(this.groups?.[i.group].name ?? []),
						options: []
					});
				}
				const group = options.find(x => x.name === i.group) as APIApplicationCommandSubcommandGroupOption;
				group.options?.push(i.toJSON());
				continue;
			}
			options.push(i.toJSON());
		}

		return {
			...super.toJSON(),
			options
		};
	}
}

export abstract class SubCommand extends BaseCommand {
	type = ApplicationCommandOptionType.Subcommand;
	group?: string;
	options?: PotoCommandOption[];

	toJSON() {
		return {
			...super.toJSON(),
			options: (this.options ?? []).map(x => ({ ...x, autocomplete: 'autocomplete' in x }) as APIApplicationCommandBasicOption),
		};
	}


	abstract run(context: CommandContext<any, any>): any;
}


export function applyToClass<
	T extends new (
		..._args: ConstructorParameters<T>
	) => InstanceType<T>,
	U extends new (
		..._args: ConstructorParameters<U>
	) => InstanceType<U>
// @ts-expect-error
>(structToApply: T, struct: U, ignore?: (keyof T['prototype'])[]) {
	const props = Object.getOwnPropertyNames(structToApply.prototype);
	console.log(props);
	for (const prop of props) {
		if (ignore?.includes(prop as keyof T) || prop === 'constructor') { continue; }
		Object.defineProperty(struct.prototype, prop, Object.getOwnPropertyDescriptor(structToApply.prototype, prop)!);
	}
	return struct as unknown as Struct<T, U>;
}

export type Struct<ToMix = {}, Final = {}> = Final extends new (
	..._args: never[]
) => infer F
	? ToMix extends new (
		..._args: never[]
	) => infer TM
	? new (
		..._args: ConstructorParameters<Final>
	) => F & TM
	: never
	: never;

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


// @Declare({
// 	name: 'set',
// 	description: 'set value'
// })
// @Group('setup')
// class SetValue extends SubCommand { }

// @Declare({
// 	description: 'Check bot ping',
// 	name: 'ping',
// 	nsfw: true
// })
// // xdd
// // justo para evitar esto es que digo lo del langs dasjdasdjdksa imaginate este objeto con 15 traducciones
// @Locales({
// 	description: [
// 		['es-ES', 'Mira la latencia del bot'],
// 	],
// 	name: [
// 		['es-ES', 'latencia']
// 	]
// })
// @Middlewares([(int: any) => int.isAdmin])
// // como mrd hago que no se tenga que declarar las descripciones cada vez
// // a? contexto pues no se que tan bien sean los decorators, pero tecnicamente el de la description llego primero asi que ya deberia existir en la clase
// // pero el declare nmo tiene que ver con el Group
// // entonces no se, como dices son cosas separadas asi que no le veo una forma XD
// @Groups({
// 	setup: {
// 		name: [['es-ES', 'xd']],
// 		description: [['es-ES', 'ddxd']],
// 		defaultDescription: 'xdddddd'
// 	}
// })
// @Options([new SetValue])
// // aya hago un @Groups para el comando base na q genio
// class Admin extends BaseCommand {

// }

// new Admin();

// q
// sisi al rato priemro quiero que prenda
// ahora pensandolo, mejor intengremos una clase like in18
// que le metamos un sistema de traducion nativamente sdasdjksdas
