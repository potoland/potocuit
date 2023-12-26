import { GuildRelatedResource } from "./default/guild-related";
// import { Role } from '@potoland/structures';

export class Roles extends GuildRelatedResource {
	namespace = "role";

	// override async get(id: string, guild: string) {
	// 	const rawRole = await super.get(id, guild) as APIRole | undefined;
	// 	return rawRole ? new Role(this.rest, this.cache, rawRole, guild) : undefined;
	// }

	// override async items(guild: string, options?: any) {
	// 	const roles = await super.items(guild, options) as APIRole[];
	// 	return roles.map(rawRole => new Role(this.rest, this.cache, rawRole, guild));
	// }
}
