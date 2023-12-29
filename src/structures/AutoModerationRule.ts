import type {
	APIAutoModerationRule,
	ObjectToLower,
	RESTPatchAPIAutoModerationRuleJSONBody,
	RESTPostAPIAutoModerationRuleJSONBody,
} from '@biscuitland/common';
import type { BaseClient } from '../client/base';
import type { MethodContext } from '../types';
import { DiscordBase } from './extra/DiscordBase';

export interface AutoModerationRule extends ObjectToLower<APIAutoModerationRule> {}

export class AutoModerationRule extends DiscordBase<APIAutoModerationRule> {
	private readonly __methods__!: ReturnType<typeof AutoModerationRule.methods>;

	constructor(client: BaseClient, data: APIAutoModerationRule) {
		super(client, data);
		Object.assign(this, {
			__methods__: AutoModerationRule.methods({ client, id: this.guildId, api: this.api, ruleId: this.id }),
		});
	}

	fetch() {
		return this.__methods__.fetch();
	}

	edit(body: ObjectToLower<RESTPatchAPIAutoModerationRuleJSONBody>, reason?: string) {
		return this.__methods__.edit({ ...body, ruleId: this.id }, reason);
	}

	delete(reason?: string) {
		return this.__methods__.delete(this.id, reason);
	}

	static methods(ctx: MethodContext<{ ruleId?: string }>) {
		return {
			list: () => ctx.api.guilds(ctx.id)['auto-moderation'].rules.get(),
			create: (body: RESTPostAPIAutoModerationRuleJSONBody) =>
				ctx.api.guilds(ctx.id)['auto-moderation'].rules.post({ body }),
			delete: (ruleId = ctx.ruleId, reason?: string) => {
				if (!ruleId) {
					throw new Error('No ruleId');
				}
				return ctx.api.guilds(ctx.id)['auto-moderation'].rules(ruleId).delete({ reason });
			},
			fetch: (ruleId = ctx.ruleId) => {
				if (!ruleId) {
					throw new Error('No ruleId');
				}
				return ctx.api.guilds(ctx.id)['auto-moderation'].rules(ruleId).get();
			},
			edit: (
				body: ObjectToLower<RESTPatchAPIAutoModerationRuleJSONBody> & { ruleId?: string } = {
					ruleId: ctx.ruleId,
				},
				reason?: string,
			) => {
				if (!body.ruleId) {
					throw new Error('No ruleId');
				}
				return ctx.api.guilds(ctx.id)['auto-moderation'].rules(body.ruleId).patch({ body, reason });
			},
		};
	}
}
