import {
	toCamelCase,
	type GatewayAutoModerationActionExecutionDispatchData,
	type GatewayAutoModerationRuleCreateDispatchData,
	type GatewayAutoModerationRuleDeleteDispatchData,
	type GatewayAutoModerationRuleUpdateDispatchData,
} from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../../cache';
import { AutoModerationRule } from '../../structures/AutoModerationRule';

export const AUTO_MODERATION_ACTION_EXECUTION = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayAutoModerationActionExecutionDispatchData
) => {
	return toCamelCase(data);
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
