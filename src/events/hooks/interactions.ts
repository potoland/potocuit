import type { GatewayInteractionCreateDispatchData } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../../cache';
import { BaseInteraction } from '../../structures/Interaction';

export const INTERACTION_CREATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayInteractionCreateDispatchData
) => {
	return BaseInteraction.from(rest, cache, data);
};
