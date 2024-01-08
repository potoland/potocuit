import type { BaseClient } from '../client/base';
import type {
	APITemplate,
	MethodContext,
	ObjectToLower,
	RESTPatchAPIGuildTemplateJSONBody,
	RESTPostAPIGuildTemplatesJSONBody,
} from '../common';
import type { Guild } from './Guild';
import { Base } from './extra/Base';

export interface GuildTemplate extends Base, ObjectToLower<APITemplate> {}

export class GuildTemplate extends Base {
	private readonly __methods__!: ReturnType<typeof GuildTemplate.methods>;

	constructor(client: BaseClient, data: APITemplate) {
		super(client);
		this.__patchThis(data);
		Object.assign(this, {
			__methods__: GuildTemplate.methods({ client, guildId: this.sourceGuildId }),
		});
	}

	async guild(force?: true): Promise<Guild<'api'>>;
	async guild(force = false) {
		if (!this.sourceGuildId) return;
		return this.client.guilds.fetch(this.sourceGuildId, force);
	}

	fetch() {
		return this.__methods__.fetch(this.code);
	}

	sync() {
		return this.__methods__.sync(this.code);
	}

	edit(body: RESTPatchAPIGuildTemplateJSONBody) {
		return this.__methods__.edit(this.code, body);
	}

	delete() {
		return this.__methods__.delete(this.code);
	}

	static methods(ctx: MethodContext<{ guildId: string }>) {
		return {
			fetch: (code: string) => ctx.client.templates.fetch(code),
			list: () => ctx.client.templates.list(ctx.guildId),
			create: (body: RESTPostAPIGuildTemplatesJSONBody) => ctx.client.templates.create(ctx.guildId, body),
			sync: (code: string) => ctx.client.templates.sync(ctx.guildId, code),
			edit: (code: string, body: RESTPatchAPIGuildTemplateJSONBody) =>
				ctx.client.templates.edit(ctx.guildId, code, body),
			delete: (code: string) => ctx.client.templates.delete(ctx.guildId, code),
		};
	}
}
