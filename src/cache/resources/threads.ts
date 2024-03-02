import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { ThreadChannel } from '../../structures';
import { GuildRelatedResource } from './default/guild-related';

export class Threads extends GuildRelatedResource {
	namespace = 'thread';

	override get(id: string): ReturnCache<ThreadChannel | undefined> {
		return fakePromise(super.get(id)).then(rawThread =>
			rawThread ? new ThreadChannel(this.client, rawThread) : undefined,
		);
	}

	// override async values(guild: string) {
	// 	const members = (await super.values(guild)) as APIThreadChannel[];
	// 	return members.map(rawThread => new ThreadChannel(this.client, rawThread));
	// }
}
