import type {
	APIApplicationCommandBasicOption,
	APIApplicationCommandOption,
	APIApplicationCommandSubcommandGroupOption,
	APIAttachment,
	LocaleString,
} from '../../common';
import { ApplicationCommandOptionType, ApplicationCommandType, magicImport } from '../../common';
import type { AllChannels, AutocompleteInteraction, GuildRole, InteractionGuildMember, User } from '../../structures';
import type { Groups, RegisteredMiddlewares } from '../decorators';
import type { OptionResolver } from '../optionresolver';
import type { CommandContext } from './chatcontext';
import type {
	NextFunction,
	OKFunction,
	OnOptionsReturnObject,
	PassFunction,
	StopFunction,
	UsingClient,
} from './shared';

export interface ReturnOptionsTypes {
	1: never; // subcommand
	2: never; // subcommandgroup
	3: string;
	4: number; // integer
	5: boolean;
	6: InteractionGuildMember | User;
	7: AllChannels;
	8: GuildRole;
	9: GuildRole | AllChannels | User;
	10: number; // number
	11: APIAttachment;
}

type Wrap<N extends ApplicationCommandOptionType> = N extends
	| ApplicationCommandOptionType.Subcommand
	| ApplicationCommandOptionType.SubcommandGroup
	? never
	: {
			required: boolean;
			value?(
				data: { context: CommandContext; value: ReturnOptionsTypes[N] },
				ok: OKFunction<any>,
				fail: StopFunction,
			): void;
	  } & {
			description: string;
			description_localizations?: APIApplicationCommandBasicOption['description_localizations'];
			name_localizations?: APIApplicationCommandBasicOption['name_localizations'];
	  };

export type __TypeWrapper<T extends ApplicationCommandOptionType> = Wrap<T>;

export type __TypesWrapper = {
	[P in keyof typeof ApplicationCommandOptionType]: `${(typeof ApplicationCommandOptionType)[P]}` extends `${infer D extends
		number}`
		? Wrap<D>
		: never;
};

export type AutocompleteCallback = (interaction: AutocompleteInteraction) => any;
export type OnAutocompleteErrorCallback = (interaction: AutocompleteInteraction, error: unknown) => any;
export type CommandBaseOption = __TypesWrapper[keyof __TypesWrapper];
export type CommandBaseAutocompleteOption = __TypesWrapper[keyof __TypesWrapper] & {
	autocomplete: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
};
export type CommandAutocompleteOption = CommandBaseAutocompleteOption & { name: string };
export type __CommandOption = CommandBaseOption; //| CommandBaseAutocompleteOption;
export type CommandOption = __CommandOption & { name: string };
export type OptionsRecord = Record<string, __CommandOption & { type: ApplicationCommandOptionType }>;

type KeysWithoutRequired<T extends OptionsRecord> = {
	[K in keyof T]-?: T[K]['required'] extends true ? never : K;
}[keyof T];

type ContextOptionsAux<T extends OptionsRecord> = {
	[K in Exclude<keyof T, KeysWithoutRequired<T>>]: T[K]['value'] extends (...args: any) => any
		? T[K]['required'] extends true
			? Parameters<Parameters<T[K]['value']>[1]>[0]
			: never
		: T[K]['required'] extends true
		  ? ReturnOptionsTypes[T[K]['type']]
		  : never;
} & {
	[K in KeysWithoutRequired<T>]?: T[K]['value'] extends (...args: any) => any
		? T[K]['required'] extends true
			? never
			: Parameters<Parameters<T[K]['value']>[1]>[0]
		: T[K]['required'] extends true
		  ? never
		  : ReturnOptionsTypes[T[K]['type']];
};

export type ContextOptions<T extends OptionsRecord> = ContextOptionsAux<T>;

class BaseCommand {
	middlewares: (keyof RegisteredMiddlewares)[] = [];

	__filePath?: string;
	__t?: { name: string; description: string };
	__d?: true;
	__tGroups?: Record<
		string /* name for group*/,
		{
			name: string;
			description: string;
			defaultDescription: string;
		}
	>;

	guild_id?: string[];
	name!: string;
	type!: number; // ApplicationCommandType.ChatInput | ApplicationCommandOptionType.Subcommand
	nsfw?: boolean;
	description!: string;
	default_member_permissions?: string;
	permissions?: bigint;
	dm?: boolean;
	name_localizations?: Partial<Record<LocaleString, string>>;
	description_localizations?: Partial<Record<LocaleString, string>>;

	options?: CommandOption[] | SubCommand[];

	/** @internal */
	async __runOptions(
		ctx: CommandContext<{}, never>,
		resolver: OptionResolver,
	): Promise<[boolean, OnOptionsReturnObject]> {
		const command = resolver.getCommand();
		if (!resolver.hoistedOptions.length || !command) {
			return [false, {}];
		}
		const data: OnOptionsReturnObject = {};
		let errored = false;
		for (const i of resolver.hoistedOptions) {
			const option = command.options!.find(x => x.name === i.name) as __CommandOption;
			const value = (await new Promise(
				resolve =>
					option.value?.({ context: ctx, value: resolver.getValue(i.name) } as never, resolve, resolve) ||
					resolve(resolver.getValue(i.name)),
			)) as unknown | Error;
			if (value instanceof Error) {
				errored = true;
				data[i.name] = {
					failed: true,
					value,
				};
				continue;
			}

			if (value === undefined) {
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
				value,
			};
		}
		return [errored, data];
	}

	/** @internal */
	static __runMiddlewares(
		context: CommandContext<{}, never>,
		middlewares: (keyof RegisteredMiddlewares)[],
		global: boolean,
	): Promise<undefined | Error | 'pass'> {
		if (!middlewares.length) {
			return Promise.resolve(undefined);
		}
		let index = 0;

		return new Promise(res => {
			let running = true;
			const pass: PassFunction = () => {
				if (!running) {
					return;
				}
				running = false;
				return res('pass');
			};
			const next: NextFunction<any> = obj => {
				if (!running) {
					return;
				}
				context[global ? 'globalMetadata' : 'metadata'] ??= {};
				// @ts-expect-error
				context[global ? 'globalMetadata' : 'metadata'][middlewares[index]] = obj;
				if (++index >= middlewares.length) {
					running = false;
					return res(undefined);
				}
				context.client.middlewares![middlewares[index]]({ context, next, stop, pass });
			};
			const stop: StopFunction = err => {
				if (!running) {
					return;
				}
				running = false;
				return res(err);
			};
			context.client.middlewares![middlewares[0]]({ context, next, stop, pass });
		});
	}

	/** @internal */
	__runMiddlewares(context: CommandContext<{}, never>) {
		return BaseCommand.__runMiddlewares(context, this.middlewares as (keyof RegisteredMiddlewares)[], false);
	}

	/** @internal */
	__runGlobalMiddlewares(context: CommandContext<{}, never>) {
		return BaseCommand.__runMiddlewares(
			context,
			(context.client.options?.globalMiddlewares ?? []) as (keyof RegisteredMiddlewares)[],
			true,
		);
	}

	toJSON() {
		return {
			name: this.name,
			type: this.type,
			nsfw: this.nsfw || false,
			description: this.description,
			name_localizations: this.name_localizations,
			description_localizations: this.description_localizations,
			guild_id: this.guild_id,
			dm_permission: this.dm,
			default_member_permissions: this.default_member_permissions,
		};
	}

	async reload() {
		delete require.cache[this.__filePath!];
		const __tempCommand = await magicImport(this.__filePath!).then(x => x.default ?? x);

		Object.setPrototypeOf(this, __tempCommand.prototype);
	}

	run?(context: CommandContext<any>): any;
	onAfterRun?(context: CommandContext<any>, error: unknown | undefined): any;
	onRunError?(context: CommandContext<any>, error: unknown): any;
	onOptionsError?(context: CommandContext<{}, never>, metadata: OnOptionsReturnObject): any;
	onMiddlewaresError?(context: CommandContext<{}, never>, error: Error): any;

	onInternalError(client: UsingClient, error?: unknown): any {
		client.logger.fatal(error);
	}
}

export class Command extends BaseCommand {
	type = ApplicationCommandType.ChatInput;

	groups?: Parameters<typeof Groups>[0];
	toJSON() {
		const options: APIApplicationCommandOption[] = [];

		for (const i of this.options ?? []) {
			if (!(i instanceof SubCommand)) {
				options.push({ ...i, autocomplete: 'autocomplete' in i } as APIApplicationCommandBasicOption);
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
						options: [],
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
			options,
		};
	}
}

export abstract class SubCommand extends BaseCommand {
	type = ApplicationCommandOptionType.Subcommand;
	group?: string;
	declare options?: CommandOption[];

	toJSON() {
		return {
			...super.toJSON(),
			options: (this.options ?? []).map(
				x => ({ ...x, autocomplete: 'autocomplete' in x }) as APIApplicationCommandBasicOption,
			),
		};
	}

	abstract run(context: CommandContext<any>): any;
	onRunError?(context: CommandContext<any>, error: unknown): any;
}
