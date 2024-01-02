import type { BaseClient } from '../client/base';
import type {
	APITemplate,
	MethodContext,
	ObjectToLower,
	RESTPatchAPIGuildTemplateJSONBody,
	RESTPostAPIGuildTemplatesJSONBody,
} from '../common';
import { Guild } from './Guild';
import { Base } from './extra/Base';

export interface GuildTemplate extends Base, ObjectToLower<APITemplate> { }

export class GuildTemplate extends Base {
	private readonly __methods__!: ReturnType<typeof GuildTemplate.methods>;

	constructor(client: BaseClient, data: APITemplate) {
		super(client);
		this._patchThis(data);
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
		return this.__methods__.fetch(this.code).then(this._patchThis);
	}

	sync() {
		return this.__methods__.sync(this.code).then(this._patchThis);
	}

	edit(body: RESTPatchAPIGuildTemplateJSONBody) {
		return this.__methods__.edit(this.code, body).then(this._patchThis);
	}

	delete() {
		return this.__methods__.delete(this.code);
	}

	static methods(ctx: MethodContext<{ guildId: string }>) {
		return {
			fetch: (code: string) => {
				return ctx.client.proxy.guilds.templates(code).get();
			},
			list: () => {
				return ctx.client.proxy.guilds(ctx.guildId).templates.get();
			},
			create: (body: RESTPostAPIGuildTemplatesJSONBody) => {
				return ctx.client.proxy.guilds(ctx.guildId).templates.post({ body });
			},
			sync: (code: string) => {
				return ctx.client.proxy.guilds(ctx.guildId).templates(code).put({});
			},
			edit: (code: string, body: RESTPatchAPIGuildTemplateJSONBody) => {
				return ctx.client.proxy.guilds(ctx.guildId).templates(code).patch({ body });
			},
			delete: (code: string) => {
				return ctx.client.proxy.guilds(ctx.guildId).templates(code).delete();
			},
		};
	}
}
