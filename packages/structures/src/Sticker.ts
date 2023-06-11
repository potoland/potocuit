import type { APISticker } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { ObjectToLower } from '.';
import { User } from './User';
import { DiscordBase } from './extra/DiscordBase';

export interface Sticker extends DiscordBase, ObjectToLower<Omit<APISticker, 'user'>> { }

export class Sticker extends DiscordBase {
	user?: User;
	constructor(rest: BiscuitREST, data: APISticker) {
		super(rest, data);
		if (data.user) {
			this.user = new User(this.rest, data.user);
		}
	}
}
