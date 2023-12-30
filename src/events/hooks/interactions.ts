import type { BaseClient } from '../../client/base';
import { BaseInteraction } from '../../structures';
import type { GatewayInteractionCreateDispatchData } from '../../common';

export const INTERACTION_CREATE = (self: BaseClient, data: GatewayInteractionCreateDispatchData) => {
	return BaseInteraction.from(self, data);
};
