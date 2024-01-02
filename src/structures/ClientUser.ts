import type { BaseClient } from '../client/base';
import type {
	APIGuild,
	GatewayReadyDispatchData,
	MethodContext,
	RESTGetAPICurrentUserGuildsQuery,
	RESTPatchAPICurrentUserJSONBody,
} from '../common';
import { AnonymousGuild } from './AnonymousGuild';
import { Guild } from './Guild';
import { GuildMember } from './GuildMember';
import { User } from './User';

export class ClientUser extends User {
	bot = true;
	constructor(
		client: BaseClient,
		data: GatewayReadyDispatchData['user'],
		public application: GatewayReadyDispatchData['application'],
	) {
		super(client, data);
	}

	async fetch() {
		const data = await this.api.users('@me').get();
		return new ClientUser(this.client, data, this.application);
	}

	async edit(body: RESTPatchAPICurrentUserJSONBody) {
		const data = await this.api.users('@me').patch({ body });
		return new ClientUser(this.client, data, this.application);
	}

	guilds = ClientUser.guilds(this);

	static guilds(ctx: MethodContext) {
		return {
			list: (query?: RESTGetAPICurrentUserGuildsQuery) => {
				return ctx.client.proxy
					.users('@me')
					.guilds.get({ query })
					.then((guilds) => guilds.map((guild) => new AnonymousGuild(ctx.client, { ...guild, splash: null })));
			},
			fetch: async (id: string) => {
				const guild = await ctx.client.proxy.guilds(id).get();
				const patched = await ctx.client.cache.guilds?.patch<APIGuild>(id, guild);
				return new Guild(ctx.client, patched ?? guild);
			},
			fetchSelf: async (id: string) => {
				const self = await ctx.client.proxy.users('@me').guilds(id).member.get();
				await ctx.client.cache.members?.patch(self.user!.id, id, self);
				return new GuildMember(ctx.client, self, self.user!, id);
			},
			leave: async (id: string) => {
				return ctx.client.proxy
					.users('@me')
					.guilds(id)
					.delete()
					.then(() => ctx.client.cache.guilds?.removeIfNI('Guilds', id));
			},
		};
	}
}
