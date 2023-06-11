import type { GatewayReadyDispatchData } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { User } from './User';

export class ClientUser extends User {
	bot = true;
	constructor(rest: BiscuitREST, data: GatewayReadyDispatchData['user'], public application: GatewayReadyDispatchData['application']) {
		super(rest, data);
	}
}
