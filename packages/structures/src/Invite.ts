import { toCamelCase, type APIExtendedInvite, type APIInvite } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { ObjectToLower } from '.';
import { Base } from './extra/Base';


export interface Invite extends ObjectToLower<APIInvite>, Base { }

export class Invite extends Base {
	constructor(rest: BiscuitREST, data: APIInvite) {
		super(rest);
		Object.assign(this, toCamelCase(data as any));
	}
}

export interface ExtendedInvite extends Invite, ObjectToLower<APIExtendedInvite> { }

export class ExtendedInvite extends Invite {
	constructor(rest: BiscuitREST, data: APIExtendedInvite) {
		super(rest, data);
	}
}
