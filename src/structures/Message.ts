import type {
	APIChannelMention,
	APIGuildMember,
	APIMessage,
	APIUser,
	GatewayMessageCreateDispatchData,
	ObjectToLower,
} from "@biscuitland/common";
import type { RawFile } from "@biscuitland/rest";
import type { BaseClient } from "../client/base";
import type { BiscuitActionRowMessageComponents } from "../components";
import { MessageActionRowComponent } from "../components/ActionRow";
import type { EmojiResolvable } from "../types/resolvables";
import type { MessageCreateBodyRequest, MessageUpdateBodyRequest } from "../types/write";
import { GuildMember } from "./GuildMember";
import { User } from "./User";
import { DiscordBase } from "./extra/DiscordBase";
import { MessagesMethods } from "./methods/channel/messages";

export type MessageData = APIMessage | GatewayMessageCreateDispatchData;

export interface Message
	extends DiscordBase,
	ObjectToLower<Omit<MessageData, "timestamp" | "author" | "mentions" | "components">> { }

export class Message extends DiscordBase {
	guildId: string | undefined;
	timestamp?: number;
	author!: User;
	components: MessageActionRowComponent<BiscuitActionRowMessageComponents>[];
	mentions: {
		roles: string[];
		channels: APIChannelMention[];
		users: (GuildMember | User)[];
	};

	private readonly __messageMethods__!: ReturnType<typeof MessagesMethods.messages>;
	private readonly __reactionMethods__!: ReturnType<typeof MessagesMethods.reactions>;

	constructor(client: BaseClient, data: MessageData) {
		super(client, data);
		this.mentions = {
			roles: data.mention_roles ?? [],
			channels: data.mention_channels ?? [],
			users: [],
		};
		this.components = data.components?.map((x) => new MessageActionRowComponent(this.rest, x)) ?? [];
		this.patch(data);
		Object.assign(this, {
			__messageMethods__: MessagesMethods.messages({ id: this.channelId, api: this.api, client }),
			__reactionMethods__: MessagesMethods.reactions({ id: this.channelId, api: this.api, client }),
		});
	}

	fetch() {
		return this.__messageMethods__.fetch(this.id).then(this._patchThis);
	}

	edit(body: MessageUpdateBodyRequest, files?: RawFile[]) {
		return this.__messageMethods__.edit(this.id, body, files);
	}

	write(body: MessageCreateBodyRequest, files?: RawFile[]) {
		return this.__messageMethods__.write(body, files);
	}

	reply(body: Omit<MessageCreateBodyRequest, "message_reference">, files?: RawFile[]) {
		return this.write(
			{
				...body,
				message_reference: {
					message_id: this.id,
					channel_id: this.channelId,
					guild_id: this.guildId,
					fail_if_not_exists: true,
				},
			},
			files,
		);
	}

	react(emoji: EmojiResolvable) {
		return this.__reactionMethods__.add(this.id, emoji);
	}

	delete(reason?: string) {
		return this.__messageMethods__.delete(this.id, reason);
	}

	crosspost(reason?: string) {
		return this.__messageMethods__.crosspost(this.id, reason);
	}

	private patch(data: MessageData) {
		if ("guild_id" in data) {
			this.guildId = data.guild_id;
		}

		if (data.type !== undefined) {
			this.type = data.type;
		}

		if ("timestamp" in data && data.timestamp) {
			this.timestamp = Date.parse(data.timestamp);
		}

		if ("application_id" in data) {
			this.applicationId = data.application_id;
		}
		if ("author" in data && data.author) {
			this.author = new User(this.client, data.author);
		}

		if (data.mentions?.length) {
			this.mentions.users = this.guildId
				? data.mentions.map(
					(m) =>
						new GuildMember(
							this.client,
							{
								...(m as APIUser & { member?: Omit<APIGuildMember, "user"> }).member!,
								user: m,
							},
							m,
							this.guildId!,
						),
				)
				: data.mentions.map((u) => new User(this.client, u));
		}
	}
}
