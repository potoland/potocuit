import type { APIGuildPreview, APIPartialGuild } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { AnonymousGuild } from './AnonymousGuild';
import type { Cache } from '../cache';

/**
 * Represent Discord Guild Preview Object
 * @link https://discord.com/developers/docs/resources/guild#guild-preview-object
 */
export class GuildPreview extends AnonymousGuild {
	constructor(rest: BiscuitREST, cache: Cache, data: APIGuildPreview) {
		super(rest, cache, data as APIPartialGuild);
	}
}
