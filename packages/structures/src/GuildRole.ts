import type { APIRole } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { ObjectToLower } from '.';
import { DiscordBase } from './extra/DiscordBase';

export interface Role extends DiscordBase, Omit<ObjectToLower<APIRole>, 'tags'> { }

export class Role extends DiscordBase {
	constructor(rest: BiscuitREST, data: APIRole, readonly guildId: string) {
		super(rest, data);
	}
}
