import { GuildRole } from '../../structures';
import { GuildRelatedResource } from './default/guild-related';

export class Roles extends GuildRelatedResource {
	namespace = 'role';

	override async get(id: string): Promise<GuildRole | undefined> {
		const rawRole = await super.get(id);
		return rawRole ? new GuildRole(this.client, rawRole, rawRole.guild_id) : undefined;
	}

	override async values(guild: string) {
		const roles = await super.values(guild);
		return roles.map((rawRole) => new GuildRole(this.client, rawRole, rawRole.guild_id));
	}
}
