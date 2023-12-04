import {
	toCamelCase,
	type GatewayAutoModerationActionExecutionDispatchData,
	type GatewayAutoModerationRuleCreateDispatchData,
	type GatewayAutoModerationRuleDeleteDispatchData,
	type GatewayAutoModerationRuleUpdateDispatchData,
} from '@biscuitland/common';
import { AutoModerationRule } from '../../structures';
import type { BaseClient } from '../../client/base';

export const AUTO_MODERATION_ACTION_EXECUTION = (
	_self: BaseClient,
	data: GatewayAutoModerationActionExecutionDispatchData
) => {
	return toCamelCase(data);
};

export const AUTO_MODERATION_RULE_CREATE = (
	self: BaseClient,
	data: GatewayAutoModerationRuleCreateDispatchData
) => {
	return new AutoModerationRule(self.rest, self.cache, data);
};

export const AUTO_MODERATION_RULE_DELETE = (
	self: BaseClient,
	data: GatewayAutoModerationRuleDeleteDispatchData
) => {
	return new AutoModerationRule(self.rest, self.cache, data);
};

export const AUTO_MODERATION_RULE_UPDATE = (
	self: BaseClient,
	data: GatewayAutoModerationRuleUpdateDispatchData
) => {
	return new AutoModerationRule(self.rest, self.cache, data);
};
