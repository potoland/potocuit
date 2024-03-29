import type { SeyfertNumberOption, SeyfertStringOption } from '../..';
import type { Attachment } from '../../builders';
import type {
	APIApplicationCommandBasicOption,
	APIApplicationCommandOption,
	APIApplicationCommandSubcommandGroupOption,
	LocaleString,
	PermissionStrings,
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
	11: Attachment;
}

type Wrap<N extends ApplicationCommandOptionType> = N extends
	| ApplicationCommandOptionType.Subcommand
	| ApplicationCommandOptionType.SubcommandGroup
	? never
	: {
			required?: boolean;
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
		? Parameters<Parameters<T[K]['value']>[1]>[0]
		: T[K] extends SeyfertStringOption | SeyfertNumberOption
		  ? T[K]['choices'] extends NonNullable<SeyfertStringOption['choices'] | SeyfertNumberOption['choices']>
				? T[K]['choices'][number]['value']
				: ReturnOptionsTypes[T[K]['type']]
		  : ReturnOptionsTypes[T[K]['type']];
} & {
	[K in KeysWithoutRequired<T>]?: T[K]['value'] extends (...args: any) => any
		? Parameters<Parameters<T[K]['value']>[1]>[0]
		: T[K] extends SeyfertStringOption | SeyfertNumberOption
		  ? T[K]['choices'] extends NonNullable<SeyfertStringOption['choices'] | SeyfertNumberOption['choices']>
				? T[K]['choices'][number]['value']
				: ReturnOptionsTypes[T[K]['type']]
		  : ReturnOptionsTypes[T[K]['type']];
};

export type ContextOptions<T extends OptionsRecord> = ContextOptionsAux<T>;

class BaseCommand {
	middlewares: (keyof RegisteredMiddlewares)[] = [];

	__filePath?: string;
	__t?: { name: string | undefined; description: string | undefined };
	__d?: true;
	__tGroups?: Record<
		string /* name for group*/,
		{
			name: string | undefined;
			description: string | undefined;
			defaultDescription: string;
		}
	>;

	guild_id?: string[];
	name!: string;
	type!: number; // ApplicationCommandType.ChatInput | ApplicationCommandOptionType.Subcommand
	nsfw?: boolean;
	description!: string;
	default_member_permissions?: string;
	botPermissions?: bigint;
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
		if (!command?.options?.length) {
			return [false, {}];
		}
		const data: OnOptionsReturnObject = {};
		let errored = false;
		for (const i of command.options ?? []) {
			try {
				const option = command.options!.find(x => x.name === i.name) as __CommandOption;
				const value =
					resolver.getHoisted(i.name)?.value !== undefined
						? await new Promise(
								(res, rej) =>
									option.value?.({ context: ctx, value: resolver.getValue(i.name) } as never, res, rej) ||
									res(resolver.getValue(i.name)),
						  )
						: undefined;

				if (value === undefined) {
					if (option.required) {
						errored = true;
						data[i.name] = {
							failed: true,
							value: `${i.name} is required but returned no value`,
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
			} catch (e) {
				errored = true;
				data[i.name] = {
					failed: true,
					value: e instanceof Error ? e.message : `${e}`,
				};
			}
		}
		return [errored, data];
	}

	/** @internal */
	static __runMiddlewares(
		context: CommandContext<{}, never>,
		middlewares: (keyof RegisteredMiddlewares)[],
		global: boolean,
	): Promise<{ error?: string; pass?: boolean }> {
		if (!middlewares.length) {
			return Promise.resolve({});
		}
		let index = 0;

		return new Promise(res => {
			let running = true;
			const pass: PassFunction = () => {
				if (!running) {
					return;
				}
				running = false;
				return res({ pass: true });
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
					return res({});
				}
				context.client.middlewares![middlewares[index]]({ context, next, stop, pass });
			};
			const stop: StopFunction = err => {
				if (!running) {
					return;
				}
				running = false;
				return res({ error: err });
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
		const data = {
			name: this.name,
			type: this.type,
			nsfw: this.nsfw || false,
			description: this.description,
			name_localizations: this.name_localizations,
			description_localizations: this.description_localizations,
			guild_id: this.guild_id,
			default_member_permissions: this.default_member_permissions,
		} as {
			name: BaseCommand['name'];
			type: BaseCommand['type'];
			nsfw: BaseCommand['nsfw'];
			description: BaseCommand['description'];
			name_localizations: BaseCommand['name_localizations'];
			description_localizations: BaseCommand['description_localizations'];
			guild_id: BaseCommand['guild_id'];
			default_member_permissions: BaseCommand['default_member_permissions'];
			dm_permission?: boolean;
		};
		if ('dm' in this) data.dm_permission = this.dm;
		return data;
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
	onMiddlewaresError?(context: CommandContext<{}, never>, error: string): any;
	onPermissionsFail?(context: CommandContext<{}, never>, permissions: PermissionStrings): any;
	onInternalError?(client: UsingClient, error?: unknown): any;
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

	onRunError(context: CommandContext<any>, error: unknown): any {
		context.client.logger.fatal(`${this.name}.<onRunError>`, context.author.id, error);
	}
	onOptionsError(context: CommandContext<{}, never>, metadata: OnOptionsReturnObject): any {
		context.client.logger.fatal(`${this.name}.<onOptionsError>`, context.author.id, metadata);
	}
	onMiddlewaresError(context: CommandContext<{}, never>, error: string): any {
		context.client.logger.fatal(`${this.name}.<onMiddlewaresError>`, context.author.id, error);
	}
	onPermissionsFail(context: CommandContext<{}, never>, permissions: PermissionStrings): any {
		context.client.logger.fatal(`${this.name}.<onPermissionsFail>`, context.author.id, permissions);
	}
	onInternalError(client: UsingClient, error?: unknown): any {
		client.logger.fatal(`${this.name}.<onInternalError>`, error);
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
}
