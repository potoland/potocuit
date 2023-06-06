import type { APIGuild } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { AnonymousGuild } from './AnonymousGuild';

export class InviteGuild extends AnonymousGuild {
	constructor(rest: BiscuitREST, data: APIGuild) {
		super(rest, data);
		this.welcomeScreen = {};
	}

	welcomeScreen?: any; // TODO
}
