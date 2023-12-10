import type { APIGuild, GatewayReadyDispatchData, RESTGetAPICurrentUserGuildsQuery, RESTPatchAPICurrentUserJSONBody } from '@biscuitland/common';
import { User } from './User';
import { AnonymousGuild } from './AnonymousGuild';
import { Guild } from './Guild';
import { GuildMember } from './GuildMember';
import type { MethodContext } from '../types';
import type { BaseClient } from '../client/base';


export class ClientUser extends User {
	bot = true;
	constructor(client: BaseClient, data: GatewayReadyDispatchData['user'], public application: GatewayReadyDispatchData['application']) {
		super(client, data);
	}

	async fetch() {
		const data = await this.api.users('@me').get();
		return this._patchThis(data);
	}

	async edit(body: RESTPatchAPICurrentUserJSONBody) {
		const data = await this.api.users('@me').patch({ body });
		return this._patchThis(data);
	}

	guilds = ClientUser.guilds(this);

	static guilds(ctx: MethodContext) {
		return {
			list: (query?: RESTGetAPICurrentUserGuildsQuery) => {
				return ctx.api.users('@me').guilds.get({ query })
					.then(guilds =>
						guilds
							.map(guild => new AnonymousGuild(ctx.client, { ...guild, splash: null })));
			},
			fetch: async (id: string) => {
				const guild = await ctx.api.guilds(id).get().then(g => ctx.client.cache.guilds?.patch<APIGuild>(id, g) ?? g);
				return new Guild(ctx.client, guild);
			},
			fetchSelf: async (id: string) => {
				const self = await ctx.api.users('@me').guilds(id).member.get();
				await ctx.client.cache.members?.patch(ctx.id, id, self);
				return new GuildMember(ctx.client, self, self.user!, id);
			},
			leave: async (id: string) => {
				return ctx.api.users('@me').guilds(id).delete().then(() => ctx.client.cache.guilds?.removeIfNI('Guilds', id));
			}
		};
	}
}
