import { toCamelCase, type APIExtendedInvite, type APIInvite, type ObjectToLower } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { Base } from './extra/Base';
import type { Cache } from './cache';


export interface Invite extends ObjectToLower<APIInvite>, Base { }

export class Invite extends Base {
	constructor(rest: BiscuitREST, cache: Cache, data: APIInvite) {
		super(rest, cache);
		Object.assign(this, toCamelCase(data as any));
	}
}

export interface ExtendedInvite extends Invite, ObjectToLower<APIExtendedInvite> { }

export class ExtendedInvite extends Invite {
	constructor(rest: BiscuitREST, cache: Cache, data: APIExtendedInvite) {
		super(rest, cache, data);
	}
}
