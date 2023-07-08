import type { APIRole, APIRoleTags } from '@biscuitland/common';
import { GuildBasedResource } from './default/guild-based';

export class Roles extends GuildBasedResource<PotoRole> {
	namespace = 'role';

	override async get(id: string, guild: string) {
		const rawRole = await super.get(id, guild);// as PotoRole | undefined;
		if (!rawRole) { return; }
		return new Role(rawRole);
	}

	override async items(guild: string, options?: any) {
		const roles = await super.items(guild, options) as unknown as PotoRole[];
		return roles.map(rawRole => new Role(rawRole));
	}
}

export class Role {
	constructor(data: PotoRole) {
		// APIRole properties
		this.id = data.id;
		this.hoist = data.hoist;
		this.permissions = data.permissions;
		this.managed = data.managed;
		this.mentionable = data.mentionable;
		this.tags = data.tags;
		this.icon = data.icon;
		this.name = data.name;
		this.color = data.color;
		this.position = data.position;
		this.unicode_emoji = data.unicode_emoji;

		// PotoRole extra properties
		this.guild_id = data.guild_id;
	}

	// APIRole properties
	id: string;
	hoist: boolean;
	permissions: string;
	managed: boolean;
	mentionable: boolean;
	tags?: APIRoleTags | undefined;
	icon?: string | null | undefined;
	name: string;
	color: number;
	position: number;
	unicode_emoji?: string | null | undefined;

	// PotoRole extra properties
	guild_id: string;
}

export type PotoRole = APIRole & { guild_id: string };
