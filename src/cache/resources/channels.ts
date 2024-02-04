import type { AllChannels } from '../../structures';
import channelFrom from '../../structures/channels';
import { GuildRelatedResource } from './default/guild-related';

export class Channels extends GuildRelatedResource {
	namespace = 'channel';

	override async get(id: string): Promise<AllChannels | undefined> {
		const rawChannel = await super.get(id);
		return rawChannel ? channelFrom(rawChannel, this.client) : undefined;
	}

	override async values(guild: string) {
		const channels = await super.values(guild);
		return channels.map(rawChannel => channelFrom(rawChannel, this.client));
	}
}
