import type { APISticker, ObjectToLower } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { User } from './User';
import { DiscordBase } from './extra/DiscordBase';
import type { Cache } from './cache';

export interface Sticker extends DiscordBase, ObjectToLower<Omit<APISticker, 'user'>> { }

export class Sticker extends DiscordBase {
	user?: User;
	constructor(rest: BiscuitREST, cache: Cache, data: APISticker) {
		super(rest, cache, data);
		if (data.user) {
			this.user = new User(this.rest, cache, data.user);
		}
	}
}
