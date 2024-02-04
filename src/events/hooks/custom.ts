import type { BaseClient } from '../../client/base';
import { ClientUser } from '../../structures';

export const BOT_READY = (_self: BaseClient, me: ClientUser) => {
	return me;
};
