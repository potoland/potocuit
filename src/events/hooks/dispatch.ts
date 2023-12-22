import type { GatewayReadyDispatchData, GatewayResumedDispatch } from "@biscuitland/common";
import type { BaseClient } from "../../client/base";
import { ClientUser } from "../../structures";

export const READY = (self: BaseClient, data: GatewayReadyDispatchData) => {
  return new ClientUser(self, data.user, data.application);
};

export const RESUMED = (_self: BaseClient, _data: GatewayResumedDispatch["d"]) => {
  return;
};
