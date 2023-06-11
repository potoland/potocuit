import type {
	APIChannelMention,
	APIGuildMember,
	APIMessage,
	APIUser,
	GatewayMessageCreateDispatchData
} from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { ObjectToLower } from '.';
import { MessageActionRowComponent } from './Components/ActionRow';
import type { BiscuitActionRowMessageComponents } from './Components/mod';
import { GuildMember } from './GuildMember';
import { User } from './User';
import { DiscordBase } from './extra/DiscordBase';

export type MessageData = APIMessage | GatewayMessageCreateDispatchData;

export interface Message extends DiscordBase, ObjectToLower<Omit<MessageData, 'timestamp' | 'author' | 'mentions' | 'components'>> { }

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

	constructor(rest: BiscuitREST, data: MessageData) {
		super(rest, data);
		// this.channelId = data.channel_id;
		this.mentions = {
			roles: data.mention_roles ?? [],
			channels: data.mention_channels ?? [],
			users: []
		};
		this.components =
			data.components?.map(x => new MessageActionRowComponent(this.rest, x)) ?? [];
		// this.pinned = !!data.pinned;
		// this.tts = !!data.tts;
		// this.mentionEveryone = !!data.mention_everyone;
		this.patch(data);
	}

	private patch(data: MessageData) {
		if ('guild_id' in data) {
			this.guildId = data.guild_id;
		}
		// if (data.type !== undefined) {
		this.type = data.type;
		// }
		// if ('timestamp' in data && data.timestamp) {
		this.timestamp = Date.parse(data.timestamp);
		// }
		if ('application_id' in data) {
			this.applicationId = data.application_id;
		}
		// if ('author' in data && data.author) {
		this.author = new User(this.rest, data.author);
		// }

		if (data.mentions.length) {
			this.mentions.users = this.guildId
				? data.mentions.map(
					m =>
						new GuildMember(
							this.rest,
							{
								...(m as APIUser & { member?: Omit<APIGuildMember, 'user'> }).member!,
								user: m
							},
							m,
							this.guildId!
						)
				)
				: data.mentions.map(u => new User(this.rest, u));
		}
	}
}

// export type MessageMention = {
// 	users?: (GuildMember | User)[];
// 	roles: string[];
// 	channels: unknown[];
// };
