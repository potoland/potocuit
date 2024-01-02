import { Webhook } from '..';
import type { RawFile } from '../api';
import type { BaseClient } from '../client/base';
import type {
	APIChannelMention,
	APIGuildMember,
	APIMessage,
	APIUser,
	GatewayMessageCreateDispatchData,
	ObjectToLower,
} from '../common';
import type { EmojiResolvable } from '../common/types/resolvables';
import type {
	MessageCreateBodyRequest,
	MessageUpdateBodyRequest,
	MessageWebhookCreateBodyRequest,
	MessageWebhookUpdateBodyRequest,
} from '../common/types/write';
import type { BiscuitActionRowMessageComponents } from '../components';
import { MessageActionRowComponent } from '../components/ActionRow';
import { Guild } from './Guild';
import { GuildMember } from './GuildMember';
import { User } from './User';
import { DiscordBase } from './extra/DiscordBase';
import { messageLink } from './extra/functions';
import { MessagesMethods } from './methods/channels';

export type MessageData = APIMessage | GatewayMessageCreateDispatchData;

export interface BaseMessage
	extends DiscordBase,
		ObjectToLower<Omit<MessageData, 'timestamp' | 'author' | 'mentions' | 'components'>> {}
export class BaseMessage extends DiscordBase {
	guildId: string | undefined;
	timestamp?: number;
	author!: User;
	member?: GuildMember;
	components: MessageActionRowComponent<BiscuitActionRowMessageComponents>[];
	mentions: {
		roles: string[];
		channels: APIChannelMention[];
		users: (GuildMember | User)[];
	};

	private readonly __reactionMethods__!: ReturnType<typeof MessagesMethods.reactions>;

	constructor(client: BaseClient, data: MessageData) {
		super(client, data);
		this.mentions = {
			roles: data.mention_roles ?? [],
			channels: data.mention_channels ?? [],
			users: [],
		};
		this.components = data.components?.map((x) => new MessageActionRowComponent(x)) ?? [];
		this.patch(data);
		Object.assign(this, {
			__reactionMethods__: MessagesMethods.reactions({ id: this.channelId, client }),
		});
	}

	get url() {
		return messageLink(this.channelId, this.id, this.guildId);
	}

	async guild(force?: true): Promise<Guild<'api'> | undefined>;
	async guild(force?: boolean): Promise<Guild<'cached'> | Guild<'api'> | undefined>;
	async guild(force = false) {
		if (!this.guildId) return;
		return this.client.guilds.fetch(this.guildId, force);
	}

	async channel(force = false) {
		return this.client.channels(this.guildId ?? '@me').fetch({ id: this.channelId, force });
	}

	react(emoji: EmojiResolvable) {
		return this.__reactionMethods__.add(this.id, emoji);
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
			this.author = new User(this.client, data.author);
		}

		if ('member' in data && data.member) {
			this.member = new GuildMember(this.client, data.member, this.author, this.guildId!);
		}

		if (data.mentions?.length) {
			this.mentions.users = this.guildId
				? data.mentions.map(
						(m) =>
							new GuildMember(
								this.client,
								{
									...(m as APIUser & { member?: Omit<APIGuildMember, 'user'> }).member!,
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

export interface Message
	extends BaseMessage,
		ObjectToLower<Omit<MessageData, 'timestamp' | 'author' | 'mentions' | 'components'>> {}

export class Message extends BaseMessage {
	private readonly __messageMethods__!: ReturnType<typeof MessagesMethods.messages>;
	constructor(client: BaseClient, data: MessageData) {
		super(client, data);
		Object.assign(this, {
			__messageMethods__: MessagesMethods.messages({
				client: this.client,
				id: this.channelId,
			}),
		});
	}

	fetch() {
		return this.__messageMethods__.fetch(this.id).then(this._patchThis);
	}

	reply(body: Omit<MessageCreateBodyRequest, 'message_reference'>, files?: RawFile[]) {
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

	edit(body: MessageUpdateBodyRequest, files?: RawFile[]) {
		return this.__messageMethods__.edit(this.id, body, files);
	}

	write(body: MessageCreateBodyRequest, files?: RawFile[]) {
		return this.__messageMethods__.write(body, files);
	}

	delete(reason?: string) {
		return this.__messageMethods__.delete(this.id, reason);
	}

	crosspost(reason?: string) {
		return this.__messageMethods__.crosspost(this.id, reason);
	}
}

export class WebhookMessage extends BaseMessage {
	private readonly __messageMethods__: ReturnType<typeof Webhook.messages>;

	constructor(client: BaseClient, data: MessageData, readonly webhookToken: string) {
		super(client, data);
		this.__messageMethods__ = Webhook.messages({ ...this, token: webhookToken });
	}

	fetch() {
		return this.api.webhooks(this.webhookId!)(this.webhookToken).get({ query: this.thread?.id }).then(this._patchThis);
	}

	edit(body: MessageWebhookUpdateBodyRequest, files?: RawFile[]) {
		return this.__messageMethods__.edit({ body, files, messageId: this.id });
	}

	write(body: MessageWebhookCreateBodyRequest, files?: RawFile[]) {
		return this.__messageMethods__.write({ body, files });
	}

	delete(reason?: string) {
		return this.__messageMethods__.delete(this.id, reason);
	}
}
