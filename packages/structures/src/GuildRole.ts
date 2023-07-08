import type { APIRole, ObjectToLower } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { DiscordBase } from './extra/DiscordBase';
import type { Cache } from './cache';

export interface Role extends DiscordBase, Omit<ObjectToLower<APIRole>, 'tags'> { }

export class Role extends DiscordBase {
	constructor(rest: BiscuitREST, cache: Cache, data: APIRole, readonly guildId: string) {
		super(rest, cache, data);
	}
}
