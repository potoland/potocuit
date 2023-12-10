import type { APIApplicationCommandInteractionDataOption, APIInteractionDataResolved, APIAttachment, MakeRequired } from '@biscuitland/common';
import { ApplicationCommandOptionType } from '@biscuitland/common';
import { User, GuildRole, InteractionGuildMember } from '../structures';
import type { PotocuitChannels } from '../structures';
import { BaseChannel } from '../structures/methods/channel/base';
import type { SubCommand, PotoCommandOption, PotoCommandAutocompleteOption, Command } from './commands';
import type { BaseClient } from '../client/base';

export class OptionResolver {
	readonly options: OptionResolved[];
	public hoistedOptions: OptionResolved[];
	private subCommand: string | null = null;
	private group: string | null = null;
	constructor(
		private client: BaseClient,
		options: APIApplicationCommandInteractionDataOption[],
		public parent?: Command,
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
			return (this.parent?.options as SubCommand[]).find(x => (this.group ? x.group === this.group : true) && x.name === this.subCommand);
		}// trmendo oneline
		// no xd, ya pero discord solo envia el comando que usas, no el objeto entero XD
		return this.parent;
	}

	getAutocompleteValue(): string | undefined {
		return this.hoistedOptions.find(option => option.focused)?.value as string;
	}

	getAutocomplete() {
		return (this.getCommand()?.options as PotoCommandOption[]).find(option => option.name === this.hoistedOptions.find(x => x.focused)?.name) as PotoCommandAutocompleteOption | undefined;
	}

	getParent() {
		return this.parent?.name;
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

	getHoisted(name: string) {
		return this.hoistedOptions.find(x => x.name === name);
	}

	getValue(name: string) {
		const option = this.getHoisted(name);
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
		if ('options' in option) { resolve.options = option.options?.map(x => this.transformOption(x, resolved)); }
		// usamos las estrucutas?
		// como cuales
		// pues solo poneoms los full, el user ,role y member
		// channel va casi full partial, las otras no les faltaria mucho
		if (resolved) { // xdddddddnose
			// wtf esto estaba completo, que le paso dasjkdjdk
			const value = resolve.value as string;
			const user = resolved.users?.[value];
			if (user) { resolve.user = new User(this.client, user); }

			const member = resolved.members?.[value];
			// ta bn igual es el raw
			// ya recuerdo que no los agregue por el tema de rest y demas dasjdkdajk
			if (member) { resolve.member = new InteractionGuildMember(this.client, member, user!, this.guildId!); }
			// xddddddddd
			const channel = resolved.channels?.[value];
			if (channel) { resolve.channel = BaseChannel.from(channel, this.client); }

			const role = resolved.roles?.[value];
			if (role) { resolve.role = new GuildRole(this.client, role, this.guildId!); }

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
