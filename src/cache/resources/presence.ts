import type { GatewayPresenceUpdate } from '../../common';
import { GuildRelatedResource } from './default/guild-related';

export class Presences extends GuildRelatedResource<PresenceResource> {
	namespace = 'presence';

	override parse(data: any, key: string, guild_id: string): PresenceResource {
		const modified = super.parse(data, key, guild_id);
		modified.user_id = modified.user?.id ?? key;
		const { user, ...rest } = modified
		return rest;
	}
}

export type PresenceResource = Omit<GatewayPresenceUpdate, 'user'> & { id: string };
