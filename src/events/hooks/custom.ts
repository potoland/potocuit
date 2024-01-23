import type { ClientUser } from '../..';
import type { BaseClient } from '../../client/base';

export const BOT_READY = (_self: BaseClient, me: ClientUser) => {
	return me;
};
