import type { APIEmoji } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { ObjectToLower } from '.';
import { DiscordBase } from './extra/DiscordBase';

export interface GuildEmoji extends DiscordBase, ObjectToLower<Omit<APIEmoji, 'id'>> { }

export class GuildEmoji extends DiscordBase {
	constructor(rest: BiscuitREST, data: Omit<APIEmoji, 'id'> & { id: string }, readonly guildId: string) {
		super(rest, data);
	}
}
