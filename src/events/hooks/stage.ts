import type {
    GatewayStageInstanceCreateDispatchData,
    GatewayStageInstanceDeleteDispatchData,
} from "@biscuitland/common";

import { toCamelCase } from "@biscuitland/common";
import type { BaseClient } from "../../client/base";

export const STAGE_INSTANCE_CREATE = (_self: BaseClient, data: GatewayStageInstanceCreateDispatchData) => {
    return toCamelCase(data);
};

export const STAGE_INSTANCE_DELETE = (_self: BaseClient, data: GatewayStageInstanceDeleteDispatchData) => {
    return toCamelCase(data);
};

export const STAGE_INSTANCE_UPDATE = (_self: BaseClient, data: GatewayStageInstanceDeleteDispatchData) => {
    return toCamelCase(data);
};
