import { PotocuitChannels } from '../../structures';
import { BaseChannel } from '../../structures/methods/channel/base';
import { GuildRelatedResource } from './default/guild-related';

export class Channels extends GuildRelatedResource {
	namespace = 'channel';

	override async get(id: string): Promise<PotocuitChannels | undefined> {
		const rawChannel = await super.get(id);
		return rawChannel ? BaseChannel.from(rawChannel, this.client) : undefined;
	}

	override async values(guild: string) {
		const channels = await super.values(guild);
		return channels.map((rawChannel) => BaseChannel.from(rawChannel, this.client));
	}
}
