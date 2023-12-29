import { GuildRelatedResource } from './default/guild-related';
// import { channelFactory } from '../../miscellaneous';

export class Channels extends GuildRelatedResource {
	namespace = 'channel';

	// override async get(id: string, guild: string) {
	// 	const rawChannel = await super.get(id, guild) as APIChannel;
	// 	return rawChannel ? channelFactory(this.rest, this.cache, rawChannel) : undefined;
	// }

	// override async items(guild: string, options?: any) {
	// 	const channels = await super.items(guild, options) as APIChannel[];
	// 	return channels.map(rawChannel => channelFactory(this.rest, this.cache, rawChannel));
	// }
}
