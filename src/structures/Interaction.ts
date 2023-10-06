import { APIBaseInteraction, APIInteraction, APIInteractionResponsePong, ObjectToLower, RESTPostAPIInteractionCallbackJSONBody, InteractionType, GatewayInteractionCreateDispatchData, When, RESTPatchAPIWebhookWithTokenMessageJSONBody, APIApplicationCommandAutocompleteInteraction, APICommandAutocompleteInteractionResponseCallbackData, InteractionResponseType, APIInteractionResponseChannelMessageWithSource, APIInteractionResponseDeferredChannelMessageWithSource, APIInteractionResponseDeferredMessageUpdate, APIInteractionResponseUpdateMessage, APIApplicationCommandInteraction } from "@biscuitland/common";
import { BiscuitREST, RawFile } from "@biscuitland/rest";
import { DiscordBase } from "./extra/DiscordBase";
import { Cache } from "../cache";
import { User } from "./User";
import { GuildMember } from "./GuildMember";
import { Message } from "./Message";

export interface BaseInteraction extends ObjectToLower<Omit<APIBaseInteraction<InteractionType, any>, 'user' | 'member'>> { }

export class BaseInteraction<FromGuild extends boolean = boolean, Type extends APIInteraction = APIInteraction> extends DiscordBase<Type> {
	user: User;
	member!: When<FromGuild, GuildMember, undefined>;
	constructor(rest: BiscuitREST, cache: Cache, interaction: Type) {
		super(rest, cache, interaction);
		if (interaction.member) this.member = new GuildMember(rest, cache, interaction.member, interaction.member!.user, interaction.guild_id!) as never;
		this.user = this.member?.user ?? new User(rest, cache, interaction.user!);

	}

	reply(body: Exclude<RESTPostAPIInteractionCallbackJSONBody, APIInteractionResponsePong>, files?: RawFile[]) {
		return this.api.interactions(this.id)(this.token).callback.post({
			body,
			files,
		});
	}

	static from(rest: BiscuitREST, cache: Cache, gateway: GatewayInteractionCreateDispatchData) {
		switch (gateway.type) {
			case InteractionType.ApplicationCommandAutocomplete:
				return new AutocompleteInteraction(rest, cache, gateway)
			case InteractionType.ApplicationCommand:
				return new ApplicationCommandInteraction(rest, cache, gateway)
			case InteractionType.MessageComponent:
			case InteractionType.ModalSubmit:
			case InteractionType.Ping: //soontm, usar low-http-server (u otro) o implemetacion propia.
			default:
				return new BaseInteraction(rest, cache, gateway);
		}
	}
}

export class AutocompleteInteraction<FromGuild extends boolean = boolean> extends BaseInteraction<FromGuild, APIApplicationCommandAutocompleteInteraction> {
	respond(choices: APICommandAutocompleteInteractionResponseCallbackData) {
		return this.reply({ data: choices, type: InteractionResponseType.ApplicationCommandAutocompleteResult })
	}
}

export class Interaction<FromGuild extends boolean = boolean, Type extends APIInteraction = APIInteraction> extends BaseInteraction<FromGuild, Type> {
	getMessage(messageId: string) {
		return this.api.webhooks(this.applicationId)(this.token).messages(messageId).get().then(data => new Message(this.rest, this.cache, data));
	}

	getResponse() {
		return this.getMessage('@original')
	}

	editMessage(messageId: string, body: RESTPatchAPIWebhookWithTokenMessageJSONBody, files?: RawFile[]) {
		return this.api.webhooks(this.applicationId)(this.token).messages(messageId).patch({
			body, files
		}).then(data => new Message(this.rest, this.cache, data))
	}

	editResponse(body: RESTPatchAPIWebhookWithTokenMessageJSONBody, files: RawFile[] = []) {
		return this.editMessage('@original', body, files)
	}

	deleteMessage(messageId: string) {
		return this.api.webhooks(this.applicationId)(this.token).messages(messageId).delete()
	}

	deleteResponse() {
		return this.deleteMessage('@original')
	}
}

export class ApplicationCommandInteraction<FromGuild extends boolean = boolean> extends Interaction<FromGuild, APIApplicationCommandInteraction> {
	respond(
		data: APIInteractionResponseChannelMessageWithSource | APIInteractionResponseDeferredChannelMessageWithSource | APIInteractionResponseDeferredMessageUpdate | APIInteractionResponseUpdateMessage,
		files: RawFile[] = []
	) {
		return this.reply(data, files);
	}
}
