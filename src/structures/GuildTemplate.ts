import type {
	APITemplate,
	ObjectToLower,
	RESTPatchAPIGuildTemplateJSONBody,
	RESTPostAPIGuildTemplatesJSONBody,
} from '@biscuitland/common';
import type { BaseClient } from '../client/base';
import type { MethodContext } from '../types';
import { Base } from './extra/Base';
import { hasProp } from './extra/functions';

export interface GuildTemplate extends Base, ObjectToLower<APITemplate> {}

export class GuildTemplate extends Base {
	private readonly __methods__!: ReturnType<typeof GuildTemplate.methods>;

	constructor(client: BaseClient, data: APITemplate) {
		super(client);
		this._patchThis(data);
		Object.assign(this, {
			__methods__: GuildTemplate.methods({ client, id: this.sourceGuildId, api: this.api, code: this.code }),
		});
	}

	fetch() {
		return this.__methods__.fetch().then(this._patchThis);
	}

	sync() {
		return this.__methods__.sync().then(this._patchThis);
	}

	edit(body: RESTPatchAPIGuildTemplateJSONBody) {
		return this.__methods__.edit(body).then(this._patchThis);
	}

	delete() {
		return this.__methods__.delete();
	}

	static methods(ctx: MethodContext<{ code?: string }>) {
		return {
			fetch: () => {
				GuildTemplate._hasCode(ctx);
				return ctx.api.guilds.templates(ctx.code).get();
			},
			list: () => {
				return ctx.api.guilds(ctx.id).templates.get();
			},
			create: (body: RESTPostAPIGuildTemplatesJSONBody) => {
				return ctx.api.guilds(ctx.id).templates.post({ body });
			},
			sync: () => {
				GuildTemplate._hasCode(ctx);
				return ctx.api.guilds(ctx.id).templates(ctx.code).put({});
			},
			edit: (body: RESTPatchAPIGuildTemplateJSONBody) => {
				GuildTemplate._hasCode(ctx);
				return ctx.api.guilds(ctx.id).templates(ctx.code).patch({ body });
			},
			delete: () => {
				GuildTemplate._hasCode(ctx);
				return ctx.api.guilds(ctx.id).templates(ctx.code).delete();
			},
		};
	}

	protected static _hasCode(ctx: { code?: string }): asserts ctx is { code: string } {
		if (!hasProp(ctx, 'code')) {
			throw new Error('Unavailable template code');
		}
	}
}
