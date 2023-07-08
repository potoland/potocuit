import type {
	APIChannelMention,
	APIGuildMember,
	APIMessage,
	APIPartialEmoji,
	APIUser,
	GatewayMessageCreateDispatchData,
	ObjectToLower,
	RESTPostAPIChannelMessageJSONBody,
} from '@biscuitland/common';
import type { BiscuitREST, RawFile } from '@biscuitland/rest';
import { TextBaseChannel } from './extra/TextBaseChannel';
import { MessageActionRowComponent } from './Components/ActionRow';
import type { BiscuitActionRowMessageComponents } from './Components/mod';
import { GuildMember } from './GuildMember';
import { User } from './User';
import { DiscordBase } from './extra/DiscordBase';
import type { Cache } from './cache';

export type MessageData = APIMessage | GatewayMessageCreateDispatchData;

export interface Message extends
	DiscordBase,
	ObjectToLower<
		Omit<MessageData, 'timestamp' | 'author' | 'mentions' | 'components'>
	> { }

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

	constructor(rest: BiscuitREST, cache: Cache, data: MessageData) {
		super(rest, cache, data);
		this.mentions = {
			roles: data.mention_roles ?? [],
			channels: data.mention_channels ?? [],
			users: [],
		};
		this.components =
			data.components?.map(x =>
				new MessageActionRowComponent(this.rest, x)
			) ?? [];
		this.patch(data);
	}

	fetch() {
		return TextBaseChannel.prototype.messages.call({ id: this.channelId, api: this.api, rest: this.rest }).fetch(this.id).then(this._patchThis);
	}

	edit(body: RESTPostAPIChannelMessageJSONBody, files?: RawFile[]) {
		return TextBaseChannel.prototype.messages.call({ id: this.channelId, api: this.api, rest: this.rest }).edit(this.id, body, files);
	}

	write(body: RESTPostAPIChannelMessageJSONBody, files?: RawFile[]) {
		return TextBaseChannel.prototype.messages.call({ id: this.channelId, api: this.api, rest: this.rest, sex: true }).write(body, files);
	}

	reply(
		body: Omit<RESTPostAPIChannelMessageJSONBody, 'message_reference'>,
		files?: RawFile[],
	) {
		return this.write({
			...body,
			message_reference: {
				message_id: this.id,
				channel_id: this.channelId,
				guild_id: this.guildId,
				fail_if_not_exists: true,
			},
		}, files);
	}

	react(emoji: string | Partial<APIPartialEmoji>) {
		return TextBaseChannel.prototype.reactions.call({ id: this.channelId, api: this.api, rest: this.rest }).add(this.id, emoji);
	}

	delete(reason?: string) {
		return TextBaseChannel.prototype.messages.call({ id: this.channelId, api: this.api, rest: this.rest }).delete(this.id, reason);
	}

	crosspost(reason?: string) {
		return TextBaseChannel.prototype.messages.call({ id: this.channelId, api: this.api, rest: this.rest }).crosspost(this.id, reason);
	}

	private patch(data: MessageData) {
		if ('guild_id' in data) {
			this.guildId = data.guild_id;
		}

		if (data.type !== undefined) {
			this.type = data.type;
		}

		if ('timestamp' in data && data.timestamp) {
			this.timestamp = Date.parse(data.timestamp);
		}

		if ('application_id' in data) {
			this.applicationId = data.application_id;
		}
		if ('author' in data && data.author) {
			this.author = new User(this.rest, this.cache, data.author);
		}

		if (data.mentions?.length) {
			this.mentions.users = this.guildId
				? data.mentions.map(
					m =>
						new GuildMember(
							this.rest,
							this.cache,
							{
								...(m as APIUser & { member?: Omit<APIGuildMember, 'user'> })
									.member!,
								user: m,
							},
							m,
							this.guildId!,
						),
				)
				: data.mentions.map(u => new User(this.rest, this.cache, u));
		}
	}
}

// export type MessageMention = {
// 	users?: (GuildMember | User)[];
// 	roles: string[];
// 	channels: unknown[];
// };
