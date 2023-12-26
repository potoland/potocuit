import type { GatewayInteractionCreateDispatchData } from "@biscuitland/common";
import type { BaseClient } from "../../client/base";
import { BaseInteraction } from "../../structures";

export const INTERACTION_CREATE = (self: BaseClient, data: GatewayInteractionCreateDispatchData) => {
	return BaseInteraction.from(self, data);
};
