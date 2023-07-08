import type {
	GatewayAutoModerationActionExecutionDispatchData,
	GatewayAutoModerationRuleCreateDispatchData,
	GatewayAutoModerationRuleDeleteDispatchData,
	GatewayAutoModerationRuleUpdateDispatchData,
} from '@biscuitland/common';

import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '@potoland/structures';

import { AutoModerationRule } from '@potoland/structures';

export const AUTO_MODERATION_ACTION_EXECUTION = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayAutoModerationActionExecutionDispatchData
) => {
	return data;
};

export const AUTO_MODERATION_RULE_CREATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayAutoModerationRuleCreateDispatchData
) => {
	return new AutoModerationRule(rest, cache, data);
};

export const AUTO_MODERATION_RULE_DELETE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayAutoModerationRuleDeleteDispatchData
) => {
	return new AutoModerationRule(rest, cache, data);
};

export const AUTO_MODERATION_RULE_UPDATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayAutoModerationRuleUpdateDispatchData
) => {
	return new AutoModerationRule(rest, cache, data);
};
