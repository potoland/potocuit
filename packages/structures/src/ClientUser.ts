import type { GatewayReadyDispatchData, RESTGetAPICurrentUserGuildsQuery, RESTPatchAPICurrentUserJSONBody } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { User } from './User';
import { AnonymousGuild } from './AnonymousGuild';
import { GuildMember } from './GuildMember';
import { Guild } from './Guild';
import type { Cache } from './cache';

export class ClientUser extends User {
	bot = true;
	constructor(rest: BiscuitREST, cache: Cache, data: GatewayReadyDispatchData['user'], public application: GatewayReadyDispatchData['application']) {
		super(rest, cache, data);
	}

	async fetch() {
		return this._patchThis((await this.api.users('@me').get()));
	}

	async edit(body: RESTPatchAPICurrentUserJSONBody) {
		return this._patchThis(await this.api.users('@me').patch({ body }));
	}

	guilds() {
		return {
			list: (query?: RESTGetAPICurrentUserGuildsQuery) => {
				return this.api.users('@me').guilds.get({ query })
					.then(guilds => guilds.map(guild => new AnonymousGuild(this.rest, this.cache, { ...guild, splash: null })));
			},
			fetch: (id: string) => {
				return this.api.guilds(id).get()
					.then(guild => new Guild(this.rest, this.cache, guild));
			},
			fetchSelf: async (guildId: string) => {
				const member = await this.api.users('@me').guilds(guildId).member.get();
				this._patchThis(member.user!);
				return new GuildMember(this.rest, this.cache, member, member.user!, guildId);
			},
			leave: (guildId: string) => {
				return this.api.users('@me').guilds(guildId).delete();
			}
		};
	}
}
