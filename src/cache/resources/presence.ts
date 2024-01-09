import type { GatewayPresenceUpdate } from '../../common';
import { GuildRelatedResource } from './default/guild-related';

export class Presences extends GuildRelatedResource<PresenceResource> {
	namespace = 'presence';

	override parse(data: any, key: string, guild_id: string): PresenceResource {
		super.parse(data, key, guild_id);
		data.user_id = data.user?.id ?? key;
		data.user = undefined;
		return data;
	}
}

export type PresenceResource = Omit<GatewayPresenceUpdate, 'user'> & { id: string };
