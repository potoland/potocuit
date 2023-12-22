import type { GatewayPresenceUpdateDispatchData } from "@biscuitland/common";

import { toCamelCase } from "@biscuitland/common";
import type { BaseClient } from "../../client/base";

export const PRESENCE_UPDATE = (_self: BaseClient, data: GatewayPresenceUpdateDispatchData) => {
    return toCamelCase(data);
};
