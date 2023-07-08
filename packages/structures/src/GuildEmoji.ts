import type { APIEmoji, ObjectToLower } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { DiscordBase } from './extra/DiscordBase';
import type { Cache } from './cache';

export interface GuildEmoji extends DiscordBase, ObjectToLower<Omit<APIEmoji, 'id'>> { }

export class GuildEmoji extends DiscordBase {
	constructor(rest: BiscuitREST, cache: Cache, data: Omit<APIEmoji, 'id'> & { id: string }, readonly guildId: string) {
		super(rest, cache, data);
	}
}
