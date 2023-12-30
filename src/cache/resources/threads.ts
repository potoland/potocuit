import { APIThreadChannel } from '../../common';
import { ThreadChannel } from '../../structures';
import { GuildRelatedResource } from './default/guild-related';

export class Threads extends GuildRelatedResource {
	namespace = 'thread';

	override async get(id: string) {
		const rawThread = (await super.get(id)) as APIThreadChannel | undefined;
		return rawThread ? new ThreadChannel(this.client, rawThread) : undefined;
	}

	override async values(guild: string) {
		const members = (await super.values(guild)) as APIThreadChannel[];
		return members.map((rawThread) => new ThreadChannel(this.client, rawThread));
	}
}
