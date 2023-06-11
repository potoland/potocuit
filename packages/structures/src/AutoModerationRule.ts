import type { APIAutoModerationRule, RESTPatchAPIAutoModerationRuleJSONBody } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { DiscordBase } from './extra/DiscordBase';
import type { ObjectToLower } from './miscellaneous';

export interface AutoModerationRule extends DiscordBase, ObjectToLower<APIAutoModerationRule> { }

export class AutoModerationRule extends DiscordBase {
	constructor(rest: BiscuitREST, data: APIAutoModerationRule) {
		super(rest, data);
	}

	edit(body: ObjectToLower<RESTPatchAPIAutoModerationRuleJSONBody>, reason?: string) {
		// @ts-expect-error fix this on biscuit/rest
		return this.api.guilds(this.guildId)['auto-moderation'].rules(this.id).patch({ body, reason });
	}

	delete(reason?: string) {
		return this.api.guilds(this.guildId)['auto-moderation'].rules(this.id).delete({ reason });
	}
}
