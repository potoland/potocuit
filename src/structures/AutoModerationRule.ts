import type { APIAutoModerationRule, ObjectToLower, RESTPatchAPIAutoModerationRuleJSONBody, RESTPostAPIAutoModerationRuleJSONBody } from '@biscuitland/common';
import { DiscordBase } from './extra/DiscordBase';
import { MethodContext } from '../types';
import { BiscuitREST } from '@biscuitland/rest';
import { Cache } from '../cache';

export interface AutoModerationRule extends ObjectToLower<APIAutoModerationRule> { }

export class AutoModerationRule extends DiscordBase<APIAutoModerationRule> {
	private readonly __methods__!: ReturnType<typeof AutoModerationRule.methods>

	constructor(
		rest: BiscuitREST,
		cache: Cache,
		data: APIAutoModerationRule,
	) {
		super(rest, cache, data);
		Object.defineProperty(this, '__methods__', {
			value: AutoModerationRule.methods({ id: this.guildId, rest: this.rest, api: this.api, cache: this.cache, ruleId: this.id }),
			writable: false,
		})
	}

	fetch() {
		return this.__methods__.fetch();
	}

	edit(body: ObjectToLower<RESTPatchAPIAutoModerationRuleJSONBody>, reason?: string) {
		return this.__methods__.edit(this.id, body, reason);
	}

	delete(reason?: string) {
		return this.__methods__.delete(this.id, reason);
	}

	static methods(ctx: MethodContext<{ ruleId?: string }>) {
		return {
			list: () => ctx.api.guilds(ctx.id)["auto-moderation"].rules.get(),
			create: (body: RESTPostAPIAutoModerationRuleJSONBody) => ctx.api.guilds(ctx.id)["auto-moderation"].rules.post({ body }),
			delete: (ruleId = ctx.ruleId, reason?: string) => {
				if (!ruleId) throw new Error('No ruleId');
				return ctx.api.guilds(ctx.id)['auto-moderation'].rules(ruleId).delete({ reason });
			},
			fetch: (ruleId = ctx.ruleId) => {
				if (!ruleId) throw new Error('No ruleId');
				return ctx.api.guilds(ctx.id)['auto-moderation'].rules(ruleId).get();
			},
			edit: (ruleId = ctx.ruleId, body: ObjectToLower<RESTPatchAPIAutoModerationRuleJSONBody>, reason?: string) => {
				if (!ruleId) throw new Error('No ruleId');
				return ctx.api.guilds(ctx.id)['auto-moderation'].rules(ruleId).patch({ body, reason });
			},
		}
	}
}
