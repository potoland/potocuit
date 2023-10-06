import { APIGuild, GatewayReadyDispatchData, RESTGetAPICurrentUserGuildsQuery, RESTPatchAPICurrentUserJSONBody } from "@biscuitland/common";
import { BiscuitREST } from "@biscuitland/rest";
import { User } from "./User";
import type { Cache } from '../cache'
import { AnonymousGuild } from "./AnonymusGuild";
import { Guild } from './Guild';
import { GuildMember } from "./GuildMember";


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

	guilds = {
		list: (query?: RESTGetAPICurrentUserGuildsQuery) => {
			return this.api.users('@me').guilds.get({ query })
				// tengo pensado en hacer un patch aqui tambien, luego veo
				.then(guilds =>
					guilds
						.map(guild => new AnonymousGuild(this.rest, this.cache, { ...guild, splash: null })));
		},
		fetch: async (id: string) => {
			const guild = await this.api.guilds(id).get().then(g => this.cache.guilds?.patch<APIGuild>(id, g) ?? g);
			return new Guild(this.rest, this.cache, guild);
		},
		fetchSelf: async (id: string) => {
			const self = await this.api.users('@me').guilds(id).member.get();
			await this.cache.members?.patch(this.id, id, self)
			return new GuildMember(this.rest, this.cache, self, self.user ?? this, id);
		},
		leave: async (id: string) => {
			return this.api.users('@me').guilds(id).delete().then(() => this.cache.guilds?.removeIfNI('Guilds', id))
		}
	}
}
