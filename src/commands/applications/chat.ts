import type {
	APIApplicationCommandBasicOption,
	APIApplicationCommandOption,
	APIApplicationCommandOptionChoice,
	APIApplicationCommandSubcommandGroupOption,
	APIAttachment,
	LocaleString,
} from '@biscuitland/common';
import { ApplicationCommandOptionType, ApplicationCommandType } from '@biscuitland/common';
import type { BaseClient } from '../../client/base';
import type {
	AutocompleteInteraction,
	GuildRole,
	InteractionGuildMember,
	PotocuitChannels,
	User,
} from '../../structures';
import type { Groups } from '../decorators';
import type { OptionResolver } from '../optionresolver';
import type { CommandContext } from './chatcontext';
import { MenuCommandContext } from './menucontext';
import {
	MiddlewareContext,
	NextFunction,
	OKFunction,
	OnOptionsReturnObject,
	PassFunction,
	StopFunction,
} from './shared';

interface ReturnOptionsTypes {
	1: never; // subcommand
	2: never; // subcommandgroup
	3: string;
	4: number; // integer
	5: boolean;
	6: InteractionGuildMember | User;
	7: PotocuitChannels;
	8: GuildRole;
	9: GuildRole | PotocuitChannels | User;
	10: number; // number
	11: APIAttachment;
}

type __Choices<T extends ApplicationCommandOptionType> = {
	choices?: APIApplicationCommandOptionChoice<ReturnOptionsTypes[T]>[];
};

type Wrap<N extends ApplicationCommandOptionType> = N extends
	| ApplicationCommandOptionType.Subcommand
	| ApplicationCommandOptionType.SubcommandGroup
	? never
	: (
			| {
					type: N;
					required?: false;
					value?(
						data: { context: CommandContext<any>; value: ReturnOptionsTypes[N] | undefined },
						ok: OKFunction<any>,
						fail: StopFunction,
					): void;
			  }
			| {
					type: N;
					required: true;
					value?(
						data: { context: CommandContext<any>; value: ReturnOptionsTypes[N] },
						ok: OKFunction<any>,
						fail: StopFunction,
					): void;
			  }
	  ) &
			Omit<APIApplicationCommandBasicOption, 'type' | 'required' | 'name'> &
			(N extends
				| ApplicationCommandOptionType.String
				| ApplicationCommandOptionType.Number
				| ApplicationCommandOptionType.Number
				? __Choices<N>
				: {});
type __TypesWrapper = {
	[P in keyof typeof ApplicationCommandOptionType]: `${(typeof ApplicationCommandOptionType)[P]}` extends `${infer D extends
		number}`
		? Wrap<D>
		: never;
};

export type AutocompleteCallback = (interaction: AutocompleteInteraction) => any;
export type OnAutocompleteErrorCallback = (interaction: AutocompleteInteraction, error: unknown) => any;
export type PotoCommandBaseOption = __TypesWrapper[keyof __TypesWrapper];
export type PotoCommandBaseAutocompleteOption = Extract<
	__TypesWrapper[keyof __TypesWrapper] & {
		autocomplete: AutocompleteCallback;
		onAutocompleteError?: OnAutocompleteErrorCallback;
	},
	{
		type:
			| ApplicationCommandOptionType.String
			| ApplicationCommandOptionType.Integer
			| ApplicationCommandOptionType.Number;
	}
>;
export type PotoCommandAutocompleteOption = PotoCommandBaseAutocompleteOption & { name: string };
export type __PotoCommandOption = PotoCommandBaseOption | PotoCommandBaseAutocompleteOption;
export type PotoCommandOption = __PotoCommandOption & { name: string };
export type OptionsRecord = Record<string, __PotoCommandOption>;

export type ContextOptions<T extends OptionsRecord> = {
	[K in keyof T]: T[K]['value'] extends (...args: any) => any
		? T[K]['required'] extends true
			? Parameters<Parameters<T[K]['value']>[1]>[0]
			: Parameters<Parameters<T[K]['value']>[1]>[0]
		: T[K]['required'] extends true
		  ? ReturnOptionsTypes[T[K]['type']]
		  : ReturnOptionsTypes[T[K]['type']] | undefined;
};

class BaseCommand {
	middlewares: MiddlewareContext[] = [];

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

	options?: PotoCommandOption[] | SubCommand[];

	/** @internal */
	async __runOptions(
		ctx: CommandContext<any, {}, []>,
		resolver: OptionResolver,
	): Promise<[boolean, OnOptionsReturnObject]> {
		const command = resolver.getCommand();
		if (!resolver.hoistedOptions.length || !command) {
			return [false, {}];
		}
		const data: OnOptionsReturnObject = {};
		let errored = false;
		for (const i of resolver.hoistedOptions) {
			const option = command.options!.find((x) => x.name === i.name) as __PotoCommandOption;
			const value = (await new Promise(
				(resolve) =>
					option.value?.({ context: ctx, value: resolver.getValue(i.name) } as never, resolve, resolve) ||
					resolve(resolver.getValue(i.name)),
			)) as any | Error;
			if (value instanceof Error) {
				errored = true;
				data[i.name] = {
					failed: true,
					value,
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
				value,
			};
		}
		return [errored, data];
	}

	/** @internal */
	static __runMiddlewares(
		context: CommandContext<'base', {}, []> | MenuCommandContext<'base', any>,
		middlewares: readonly MiddlewareContext[],
		global: boolean,
	): Promise<[any, undefined] | [undefined, Error] | 'pass'> {
		if (!middlewares.length) {
			return Promise.resolve([{}, undefined]);
		}
		const metadata: Record<string, any> = {};
		let index = 0;

		return new Promise((res) => {
			let running = true;
			const pass: PassFunction = () => {
				if (!running) {
					return;
				}
				running = false;
				return res('pass');
			};
			const next: NextFunction<any> = (obj) => {
				if (!running) {
					return;
				}
				Object.assign(metadata, obj ?? {});
				if (++index >= middlewares.length) {
					running = false;
					// @ts-expect-error globalMetadata doesnt exist, but is used for global middlewares
					context[global ? 'globalMetadata' : 'metadata'] = metadata;
					return res([metadata, undefined]);
				}
				middlewares[index]({ context, next, stop, pass });
			};
			const stop: StopFunction = (err) => {
				if (!running) {
					return;
				}
				running = false;
				return res([undefined, err]);
			};
			middlewares[0]({ context, next, stop, pass });
		});
	}

	/** @internal */
	__runMiddlewares(context: CommandContext<'base', {}, []> | MenuCommandContext<'base', any>) {
		return BaseCommand.__runMiddlewares(context, this.middlewares, false);
	}

	/** @internal */
	__runGlobalMiddlewares(context: CommandContext<'base', {}, []> | MenuCommandContext<'base', any>) {
		return BaseCommand.__runMiddlewares(context, context.client.options?.globalMiddlewares ?? [], true);
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
		const __tempCommand = await import(this.__filePath!).then((x) => x.default ?? x);

		Object.setPrototypeOf(this, __tempCommand.prototype);
	}

	run?(context: CommandContext<any, any>): any;
	onRunError?(context: CommandContext<any, any>, error: unknown): any;
	onOptionsError?(context: CommandContext<any, {}, []>, metadata: OnOptionsReturnObject): any;
	onMiddlewaresError?(context: CommandContext<any, {}, []>, error: Error): any;

	onInternalError(client: BaseClient, error?: unknown): any {
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
				if (!options.find((x) => x.name === i.group)) {
					options.push({
						type: ApplicationCommandOptionType.SubcommandGroup,
						name: i.group,
						description: this.groups![i.group].defaultDescription,
						description_localizations: Object.fromEntries(this.groups?.[i.group].description ?? []),
						name_localizations: Object.fromEntries(this.groups?.[i.group].name ?? []),
						options: [],
					});
				}
				const group = options.find((x) => x.name === i.group) as APIApplicationCommandSubcommandGroupOption;
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
	declare options?: PotoCommandOption[];

	toJSON() {
		return {
			...super.toJSON(),
			options: (this.options ?? []).map(
				(x) => ({ ...x, autocomplete: 'autocomplete' in x }) as APIApplicationCommandBasicOption,
			),
		};
	}

	abstract run(context: CommandContext<any, any>): any;
	onRunError?(context: CommandContext<any, any>, error: unknown): any;
}
