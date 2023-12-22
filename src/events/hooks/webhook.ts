import type { GatewayWebhooksUpdateDispatchData } from "@biscuitland/common";
import { toCamelCase } from "@biscuitland/common";
import type { BaseClient } from "../../client/base";

export const WEBHOOKS_UPDATE = (_self: BaseClient, data: GatewayWebhooksUpdateDispatchData) => {
    return toCamelCase(data);
};
