import type { DiscordPresenceUpdate } from '@biscuitland/api-types';
import { GuildBasedResource } from './default/guild-based';

export class Presences extends GuildBasedResource<PotoPresence> {
	namespace = 'presence';

	override parse(data: any, key: string, _guild_id: string): PotoPresence {
		data.user_id = data.user?.id ?? key;
		delete data.user;
		return data;
	}
}

export type PotoPresence = Omit<DiscordPresenceUpdate, 'user'> & { user_id: string };
