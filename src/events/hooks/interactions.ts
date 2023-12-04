import type { GatewayInteractionCreateDispatchData } from '@biscuitland/common';
import { BaseInteraction } from '../../structures';
import type { BaseClient } from '../../client/base';

export const INTERACTION_CREATE = (
	self: BaseClient,
	data: GatewayInteractionCreateDispatchData
) => {
	return BaseInteraction.from(self, data);
};
