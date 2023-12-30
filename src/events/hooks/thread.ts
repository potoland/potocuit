import type { BaseClient } from '../../client/base';
import { ThreadChannel } from '../../structures';
import type {
	GatewayThreadCreateDispatchData,
	GatewayThreadDeleteDispatchData,
	GatewayThreadListSyncDispatchData,
	GatewayThreadMemberUpdateDispatchData,
	GatewayThreadMembersUpdateDispatchData,
	GatewayThreadUpdateDispatchData,
} from '../../common';
import { toCamelCase } from '../../common';

export const THREAD_CREATE = (self: BaseClient, data: GatewayThreadCreateDispatchData) => {
	return new ThreadChannel(self, data);
};

export const THREAD_DELETE = (self: BaseClient, data: GatewayThreadDeleteDispatchData) => {
	return new ThreadChannel(self, data);
};

export const THREAD_LIST_SYNC = (_self: BaseClient, data: GatewayThreadListSyncDispatchData) => {
	return toCamelCase(data);
};

export const THREAD_MEMBER_UPDATE = (_self: BaseClient, data: GatewayThreadMemberUpdateDispatchData) => {
	return toCamelCase(data);
};

export const THREAD_MEMBERS_UPDATE = (_self: BaseClient, data: GatewayThreadMembersUpdateDispatchData) => {
	return toCamelCase(data);
};

export const THREAD_UPDATE = (self: BaseClient, data: GatewayThreadUpdateDispatchData) => {
	return new ThreadChannel(self, data);
};
