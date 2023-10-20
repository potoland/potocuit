import type { APIGuild, APIPartialGuild, ObjectToLower } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../cache';
import { BaseGuild } from './extra/BaseGuild';
import type { DiscordBase } from './extra/DiscordBase';
import { GuildMember } from './GuildMember';
import { GuildTemplate } from './GuildTemplate';
import { Sticker } from './Sticker';
import { GuildRole } from './GuildRole';
import { AutoModerationRule } from './AutoModerationRule';
import { BaseChannel } from './methods/channel/base';
import type { ToClass } from '../types/util';

export interface Guild extends Omit<ObjectToLower<APIGuild>, 'stickers' | 'emojis' | 'roles'>, DiscordBase {
}

export class Guild extends (BaseGuild as unknown as ToClass<Omit<BaseGuild, keyof ObjectToLower<APIPartialGuild>>, Guild>) {
	constructor(rest: BiscuitREST, cache: Cache, data: APIGuild) {
		super(rest, cache, data);
	}

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

	async fetchOwner(force = false) {
		// For no reason, discord has some guilds without owner... 🤓
		if (!this.ownerId) { return null; }
		return this.members.fetch(this.ownerId, force);
	}

	templates = GuildTemplate.methods(this);
	stickers = Sticker.methods(this);
	members = GuildMember.methods(this);
	moderationRules = AutoModerationRule.methods(this);
	roles = GuildRole.methods(this);
	channels = BaseChannel.methods(this);
}

/** Maximun custom guild emojis per level */
export type MaxEmojis = 50 | 100 | 150 | 250;

/** Maximun custom guild stickers per level */
export type MaxStickers = 5 | 15 | 30 | 60;
