import type { BaseClient } from '../client/base';
import type {
	APIAutoModerationRule,
	MethodContext,
	ObjectToLower,
	RESTPatchAPIAutoModerationRuleJSONBody,
	RESTPostAPIAutoModerationRuleJSONBody,
} from '../common';
import { Guild } from './Guild';
import { DiscordBase } from './extra/DiscordBase';

export interface AutoModerationRule extends ObjectToLower<APIAutoModerationRule> {}

export class AutoModerationRule extends DiscordBase<APIAutoModerationRule> {
	constructor(client: BaseClient, data: APIAutoModerationRule) {
		super(client, data);
	}

	async fetchCreator(force = false) {
		return this.client.members.fetch(this.guildId, this.creatorId, force);
	}

	async guild(force?: true): Promise<Guild<'api'>>;
	async guild(force?: boolean): Promise<Guild<'cached'> | Guild<'api'> | undefined>;
	async guild(force = false): Promise<Guild<'cached'> | Guild<'api'>> {
		return this.client.guilds.fetch(this.guildId, force);
	}

	fetch() {
		return this.client.guilds.moderation.fetch(this.guildId, this.id);
	}

	edit(body: ObjectToLower<RESTPatchAPIAutoModerationRuleJSONBody>, reason?: string) {
		return this.client.guilds.moderation.edit(this.guildId, this.id, body, reason);
	}

	delete(reason?: string) {
		return this.client.guilds.moderation.delete(this.guildId, this.id, reason);
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		const methods = client.guilds.moderation;
		return {
			list: () => methods.list(guildId),
			create: (body: RESTPostAPIAutoModerationRuleJSONBody) => methods.create(guildId, body),
			delete: (ruleId: string, reason?: string) => methods.delete(guildId, ruleId, reason),
			fetch: (ruleId: string) => methods.fetch(guildId, ruleId),
			edit: (ruleId: string, body: RESTPatchAPIAutoModerationRuleJSONBody, reason?: string) =>
				methods.edit(guildId, ruleId, body, reason),
		};
	}
}
