import type { APIAutoModerationRule, ObjectToLower, RESTPatchAPIAutoModerationRuleJSONBody } from '@biscuitland/common';
import { DiscordBase } from './extra/DiscordBase';

export interface AutoModerationRule extends ObjectToLower<APIAutoModerationRule> { }

export class AutoModerationRule extends DiscordBase<APIAutoModerationRule> {
	edit(body: ObjectToLower<RESTPatchAPIAutoModerationRuleJSONBody>, reason?: string) {
		return this.api.guilds(this.guildId)['auto-moderation'].rules(this.id).patch({ body, reason });
	}

	delete(reason?: string) {
		return this.api.guilds(this.guildId)['auto-moderation'].rules(this.id).delete({ reason });
	}
}
