import { toCamelCase, type GatewayApplicationCommandPermissionsUpdateDispatchData } from "@biscuitland/common";
import type { BaseClient } from "../../client/base";

export const APPLICATION_COMMAND_PERMISSIONS_UPDATE = (
	_self: BaseClient,
	data: GatewayApplicationCommandPermissionsUpdateDispatchData,
) => {
	return toCamelCase(data);
};
