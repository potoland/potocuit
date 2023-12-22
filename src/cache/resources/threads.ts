import { GuildRelatedResource } from "./default/guild-related";
// import { ThreadChannel } from '../../ThreadChannel';

export class Threads extends GuildRelatedResource {
    namespace = "thread";

    // override async get(id: string, guild: string) {
    // 	const rawThread = await super.get(id, guild) as APIThreadChannel | undefined;
    // 	return rawThread ? new ThreadChannel(this.rest, this.cache, rawThread) : undefined;
    // }

    // override async items(guild: string, options?: any) {
    // 	const members = await super.items(guild, options) as APIThreadChannel[];
    // 	return members.map(rawThread => new ThreadChannel(this.rest, this.cache, rawThread));
    // }
}
