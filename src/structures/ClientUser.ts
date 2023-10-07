import { APIGuild, GatewayReadyDispatchData, RESTGetAPICurrentUserGuildsQuery, RESTPatchAPICurrentUserJSONBody } from "@biscuitland/common";
import { BiscuitREST } from "@biscuitland/rest";
import { User } from "./User";
import type { Cache } from '../cache'
import { AnonymousGuild } from "./AnonymousGuild";
import { Guild } from './Guild';
import { GuildMember } from "./GuildMember";
import { MethodContext } from "../types";


export class ClientUser extends User {
	bot = true;
	constructor(rest: BiscuitREST, cache: Cache, data: GatewayReadyDispatchData['user'], public application: GatewayReadyDispatchData['application']) {
		super(rest, cache, data);
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
							.map(guild => new AnonymousGuild(ctx.rest, ctx.cache, { ...guild, splash: null })));
			},
			fetch: async (id: string) => {
				const guild = await ctx.api.guilds(id).get().then(g => ctx.cache.guilds?.patch<APIGuild>(id, g) ?? g);
				return new Guild(ctx.rest, ctx.cache, guild);
			},
			fetchSelf: async (id: string) => {
				const self = await ctx.api.users('@me').guilds(id).member.get();
				await ctx.cache.members?.patch(ctx.id, id, self)
				return new GuildMember(ctx.rest, ctx.cache, self, self.user!, id);
			},
			leave: async (id: string) => {
				return ctx.api.users('@me').guilds(id).delete().then(() => ctx.cache.guilds?.removeIfNI('Guilds', id));
			}
		}
	}
}
