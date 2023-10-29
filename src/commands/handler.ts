import type { APIApplicationCommandInteractionDataOption, APIAttachment, APIInteractionDataResolved, MakeRequired } from '@biscuitland/common';
import { ApplicationCommandOptionType } from '@biscuitland/common';

import type { PotoCommandAutocompleteOption, PotoCommandOption, SubCommand } from './commands';
import { Command } from './commands';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../cache';
import { User } from '../structures/User';
import { InteractionGuildMember } from '../structures/GuildMember';
import { BaseChannel } from '../structures/methods/channel/base';
import { GuildRole } from '../structures/GuildRole';
import type { PotocuitChannels } from '../structures/channels';

// type Interaction = Extract<GatewayInteractionCreateDispatchData, APIChatInputApplicationCommandInteraction>;

export class PotoHandler {
	protected async getFiles(dir: string) {
		const files: string[] = [];

		for (const i of await readdir(dir, { withFileTypes: true })) {
			if (i.isDirectory()) { files.push(...await this.getFiles(join(dir, i.name))); } else { files.push(join(dir, i.name)); }
		}

		return files;
	}

	// imagina tener autocompletado putovsc web
	protected async loadFiles<T extends NonNullable<unknown>>(paths: string[]): Promise<T[]> {
		return await Promise.all(paths.map(path => import(path).then(file => file.default ?? file)));
	}
}
// y si dejamos lo extra para el final
// te escribir por discord para hablar de eso y ni caso
export class PotoLangsHandler extends PotoHandler {

}

export class PotoCommandHandler extends PotoHandler {
	commands: Command[] = [];

	// constructor() {
	// 	return;
	// }

	// findCommand(
	// 	interaction: Interaction['data'],
	// 	parent: Command
	// ): { command: Command | SubCommand; options: APIApplicationCommandInteractionDataBasicOption[] } {
	// 	if (!interaction.options
	// 		?.some(x =>
	// 			[ApplicationCommandOptionType.Subcommand, ApplicationCommandOptionType.SubcommandGroup]
	// 				.includes(x.type)
	// 		)
	// 	) {
	// 		return {
	// 			// pero, tas haciendo estas cosas aqui y yo en el optionresolver djaskdskd
	// 			// y sigo diciendo que hacer todo en la clase en vez de escribir todo este codigo espaguetti es mejor cof cof cof
	// 			command: parent,
	// 			options: (interaction.options ?? []) as APIApplicationCommandInteractionDataBasicOption[]
	// 		};
	// 	}
	// 	const { command, options } = this.findSubCommand(interaction.options as APIApplicationCommandInteractionDataSubcommandOption[] | APIApplicationCommandInteractionDataSubcommandGroupOption[], parent.options!.find(x => x.name === interaction.options![0].name) as SubCommand);
	// 	return {
	// 		command,
	// 		options
	// 	} as unknown as { command: Command; options: APIApplicationCommandInteractionDataBasicOption[] };
	// }

	// // ni idea de q hablas xdxd
	// // https://old.discordjs.dev/#/docs/discord.js/main/class/CommandInteractionOptionResolver
	// // a no, se supone que aqui obtendre todo eso, en el findCommand
	// // deja hago el resolver
	// private findSubCommand(
	// 	options: APIApplicationCommandInteractionDataSubcommandOption[] | APIApplicationCommandInteractionDataSubcommandGroupOption[],
	// 	subcommand: SubCommand
	// ): { command: SubCommand; options: APIApplicationCommandInteractionDataOption[] } {
	// 	console.log({ subcommand, options });
	// 	if (subcommand.type === ApplicationCommandOptionType.SubcommandGroup) {
	// 		// estos finds te los ahorraras si me dejas terminar xd
	// 		return {
	// 			command: subcommand.options!.find(x => x.name === options[0].options![0].name) as unknown as SubCommand,
	// 			options: (options[0] as APIApplicationCommandInteractionDataSubcommandGroupOption).options![0].options ?? []
	// 		};
	// 	}
	// 	return {
	// 		command: subcommand,
	// 		options: options[0].options ?? []
	// 	};

	// }

	// no tocar.
	async loadCommands(commandsDir: string) {
		this.commands = [...await this.loadFiles<Command>(await this.getFiles(commandsDir))];
		// nose, esto ya funciona dejalo asi yafuncionayfnacyfifnayfaofnayocafnyaoafynafaiocfuynafyanonifaayfoancoa \\ok
		// console.log(commands);
		// mucho tryhardeo
		const result: Record<string, any> = {};

		for (const cmd of this.commands) {
			if (!(cmd instanceof Command)) { continue; }
			const command = cmd.toJSON();
			// const groups = command.groups
			// 	? Object.entries(command.groups).map(x => x[0]).join(', ')
			// 	: undefined
			// console.log(`Command ${command.name} ${groups ? 'groups: ' + groups : ''}`);

			// console.log('command', command)
			if (cmd.groups) {
				const groups = Object.entries(cmd.groups)
					.map(x => ({
						name: x[0],
						name_localizations: x[1].name ? Object.fromEntries(x[1].name) : {},
						description: x[1].defaultDescription,
						description_localizations: x[1].description ? Object.fromEntries(x[1].description) : {},
						type: ApplicationCommandOptionType.SubcommandGroup,
						options: command.options// .filter(op => op.group === x[0])
					}));

				// console.log('groups', groups, command.options);
				command.options ??= [];

				command.options = command.options.filter(x => !('group' in x));
				// (no tocar)
				// @ts-expect-error
				command.options.push(...groups);
			}// pero que? xdxd, maps es para debiles aka djs, nmo uso delete, no los elimino (?) xd
			// dejalo asi // y para no usar delete dsajdskaj y como eliminas comandos? = undefined? :trolleador:
			// esto no deberia de ser un map? pto tryhard
			result[command.name] = command;

			// console.log(obj, 'obj')
		}

		return result;
	}
}

// export type OptionFilter = { filter: (option: OptionResolved['value']) => void; fail: () => NonNullable<unknown> };

export class OptionResolver {
	readonly options: OptionResolved[];
	public hoistedOptions: OptionResolved[];
	private subCommand: string | null = null;
	private group: string | null = null;
	constructor(
		private rest: BiscuitREST,
		private cache: Cache,
		options: APIApplicationCommandInteractionDataOption[],
		public parent: Command,
		public guildId?: string,
		public resolved?: APIInteractionDataResolved
	) {
		// esto funciona con subcomandos? si
		this.hoistedOptions = this.options = options.map(option => this.transformOption(option, resolved));

		if (this.hoistedOptions[0]?.type === ApplicationCommandOptionType.Subcommand) {
			this.subCommand = this.hoistedOptions[0].name;
			this.hoistedOptions = this.hoistedOptions[0].options ?? [];
		}
		if (this.hoistedOptions[0]?.type === ApplicationCommandOptionType.SubcommandGroup) {
			this.group = this.hoistedOptions[0].name;
			this.subCommand = this.hoistedOptions[0].options![0]!.name;
			this.hoistedOptions = this.hoistedOptions[0].options![0].options ?? [];
		}// asi? xdd
		// en djs no ponian lo del sub dentro del group asi que ni idea, pero en papel deberia funcionar
	}// mira abajo xd

	// /xddddddddddddddd, me debi fijar de djs (wtf djs hacinedo las cosas bien xdd)
	// potente y tu hardcodeadndo a lo pendejo (te dije que era la unica cosa que me gustaba de ellos xd)
	// por que nunca se me ocurrio hacerlo asi // por cabezon

	getCommand() {
		// /xdd
		// if (this.group) {
		// 	return ((this.parent.options as SubCommand[]).find(x => x.group === this.group)?.options as unknown as SubCommand[])?.find(x => x.name === this.subCommand) as SubCommand;
		// }
		if (this.subCommand) {
			// ahora que veo, esto te devolvera el primer sub command sin discriminar XD
			return (this.parent.options as SubCommand[]).find(x => (this.group ? x.group === this.group : true) && x.name === this.subCommand);
		}// trmendo oneline
		// no xd, ya pero discord solo envia el comando que usas, no el objeto entero XD
		return this.parent;
	}

	getAutocompleteValue<T = string | number | boolean>(): T | null {
		return this.hoistedOptions.find(option => option.focused)?.value as T;
	}

	getAutocomplete() {
		return (this.getCommand()?.options as PotoCommandOption[]).find(option => option.name === this.hoistedOptions[0].name) as PotoCommandAutocompleteOption;
	}

	getParent() {
		return this.parent.name;
	}

	getSubCommand() {
		return this.subCommand;
	}

	getGroup() {
		return this.group;
	}

	get(name: string) {
		return this.options.find(opt => opt.name === name);
	}

	getValue(name: string) {
		const option = this.get(name);
		if (!option) { return; }

		switch (option.type) {
			case ApplicationCommandOptionType.Attachment:
				return option.attachment!;
			case ApplicationCommandOptionType.Boolean:
				return option.value as boolean;
			case ApplicationCommandOptionType.Channel:
				return option.channel!;
			case ApplicationCommandOptionType.Integer:
			case ApplicationCommandOptionType.Number:
				return option.value as number;
			case ApplicationCommandOptionType.Role:
				return option.role;
			case ApplicationCommandOptionType.String:
				return option.value as string;
			case ApplicationCommandOptionType.User:
				return option.member ?? option.user;
			case ApplicationCommandOptionType.Mentionable:
				return option.member ?? option.user ?? option.channel ?? option.role;
			default:
				return;
		}
	}

	private getTypedOption(name: string, allow: ApplicationCommandOptionType[]) {
		const option = this.get(name);
		if (!option) { throw new Error('Bad Option'); }
		if (!allow.includes(option.type)) { throw new Error('Bad Option'); }
		return option;
	}

	getChannel(name: string, required?: true): PotocuitChannels;
	getChannel(name: string): PotocuitChannels | undefined {
		const option = this.getTypedOption(name, [ApplicationCommandOptionType.Channel]);
		return option.channel;
	}

	getString(name: string, required?: true): string;
	getString(name: string): string | null {
		const option = this.getTypedOption(name, [ApplicationCommandOptionType.String]);
		return option.value as string;
	}

	// xdd ? // nao, ahi va asi porque si le pasan un sub lo hace recursivo, la cosa es que junta todas las options en 1 solo array
	transformOption(option: APIApplicationCommandInteractionDataOption, resolved?: APIInteractionDataResolved) {
		const resolve: OptionResolved = {
			...option
		};

		if ('value' in option) { resolve.value = option.value; }
		if ('options' in option) { resolve.options = option.options?.map(this.transformOption); }
		// usamos las estrucutas?
		// como cuales
		// pues solo poneoms los full, el user ,role y member
		// channel va casi full partial, las otras no les faltaria mucho
		if (resolved) { // xdddddddnose
			// wtf esto estaba completo, que le paso dasjkdjdk
			const value = resolve.value as string;
			const user = resolved.users?.[value];
			if (user) { resolve.user = new User(this.rest, this.cache, user); }

			const member = resolved.members?.[value];
			// ta bn igual es el raw
			// ya recuerdo que no los agregue por el tema de rest y demas dasjdkdajk
			if (member) { resolve.member = new InteractionGuildMember(this.rest, this.cache, member, user!, this.guildId!); }
			// xddddddddd
			const channel = resolved.channels?.[value];
			if (channel) { resolve.channel = BaseChannel.from(channel, this.rest, this.cache); }

			const role = resolved.roles?.[value];
			if (role) { resolve.role = new GuildRole(this.rest, this.cache, role, this.guildId!); }

			const attachment = resolved.attachments?.[value];
			if (attachment) { resolve.attachment = attachment; }
		}

		return resolve;
	}
}

export interface OptionResolved {
	name: string;
	type: ApplicationCommandOptionType;
	value?: string | number | boolean;
	options?: OptionResolved[];
	user?: User;
	member?: InteractionGuildMember;
	attachment?: APIAttachment;
	channel?: PotocuitChannels;
	role?: GuildRole;
	focused?: boolean;
}

export type OptionResolvedWithValue = MakeRequired<Pick<OptionResolved, 'name' | 'value' | 'focused'>, 'value'> & { type: ApplicationCommandOptionType.Boolean | ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number | ApplicationCommandOptionType.String };

export type OptionResolvedWithProp = Exclude<OptionResolved, { type: ApplicationCommandOptionType.Boolean | ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number | ApplicationCommandOptionType.String }>;
