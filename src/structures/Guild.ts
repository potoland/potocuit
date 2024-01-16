import type { BaseClient } from '../client/base';
import type { APIGuild, APIPartialGuild, GatewayGuildCreateDispatchData, ObjectToLower } from '../common';
import type { StructPropState, StructStates, ToClass } from '../common/types/util';
import { AutoModerationRule } from './AutoModerationRule';
import { GuildMember } from './GuildMember';
import { GuildRole } from './GuildRole';
import { GuildTemplate } from './GuildTemplate';
import { Sticker } from './Sticker';
import { BaseGuild } from './extra/BaseGuild';
import type { DiscordBase } from './extra/DiscordBase';
import { BaseChannel, WebhookGuildMethods } from './methods/channels';

export interface Guild extends Omit<ObjectToLower<APIGuild>, 'stickers' | 'emojis' | 'roles'>, DiscordBase {}
export class Guild<State extends StructStates = 'api'> extends (BaseGuild as unknown as ToClass<
	Omit<BaseGuild, keyof ObjectToLower<APIPartialGuild>>,
	Guild
>) {
	joinedAt!: StructPropState<number, State, 'create'>;
	memberCount!: StructPropState<number, State, 'create'>;
	large!: StructPropState<boolean, State, 'create'>;
	unavailable?: StructPropState<boolean, State, 'create'>;

	constructor(client: BaseClient, data: APIGuild | GatewayGuildCreateDispatchData) {
		super(client, data);

		if ('joined_at' in data) {
			this.joinedAt = Number(data.joined_at) as never;
			this.memberCount = data.member_count as never;
			this.large = data.large as never;
			this.unavailable = data.unavailable as never;
		}
	}

	webhooks = WebhookGuildMethods.guild({ client: this.client, guildId: this.id });

	get maxStickers(): MaxStickers {
		switch (this.premiumTier) {
			case 1:
				return 15;
			case 2:
				return 30;
			case 3:
				return 60;
			default:
				return 5;
		}
	}

	get maxEmojis(): MaxEmojis {
		switch (this.premiumTier) {
			case 1:
				return 100;
			case 2:
				return 150;
			case 3:
				return 250;
			default:
				return 50;
		}
	}

	fetchOwner(force = false) {
		// For no reason, discord has some guilds without owner... 🤓
		if (!this.ownerId) {
			return null;
		}
		return this.members.fetch(this.ownerId, force);
	}

	templates = GuildTemplate.methods({ client: this.client, guildId: this.id });
	stickers = Sticker.methods({ client: this.client, guildId: this.id });
	members = GuildMember.methods({ client: this.client, guildId: this.id });
	moderationRules = AutoModerationRule.methods({ client: this.client, guildId: this.id });
	roles = GuildRole.methods({ client: this.client, guildId: this.id });
	channels = BaseChannel.allMethods({ client: this.client, guildId: this.id });
}

/** Maximun custom guild emojis per level */
export type MaxEmojis = 50 | 100 | 150 | 250;

/** Maximun custom guild stickers per level */
export type MaxStickers = 5 | 15 | 30 | 60;
