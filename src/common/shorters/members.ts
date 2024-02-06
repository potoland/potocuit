import {
	FormattingPatterns,
	type GuildMemberResolvable,
	type RESTGetAPIGuildMembersQuery,
	type RESTGetAPIGuildMembersSearchQuery,
	type RESTPatchAPIGuildMemberJSONBody,
	type RESTPutAPIGuildBanJSONBody,
	type RESTPutAPIGuildMemberJSONBody,
} from '..';
import { GuildMember } from '../../structures';
import { BaseShorter } from './base';

export class MemberShorter extends BaseShorter {
	get members() {
		return {
			resolve: async (guildId: string, resolve: GuildMemberResolvable) => {
				if (typeof resolve === 'string') {
					const match: { id?: string } | undefined = resolve.match(FormattingPatterns.User)?.groups;
					if (match?.id) {
						return this.members.fetch(guildId, match.id);
					}
					if (resolve.match(/\d{17,20}/)) {
						return this.members.fetch(guildId, resolve);
					}

					return this.members.search(guildId, { query: resolve, limit: 1 }).then(x => x[0]);
				}

				if (resolve.id) {
					return this.client.members.fetch(guildId, resolve.id);
				}

				return resolve.displayName ? this.members.search(guildId, { query: resolve.displayName, limit: 1 }).then(x => x[0]) : undefined;
			},
			search: async (guildId: string, query?: RESTGetAPIGuildMembersSearchQuery) => {
				const members = await this.client.proxy.guilds(guildId).members.search.get({
					query,
				});
				await this.client.cache.members?.set(
					members.map(x => [x.user!.id, x]),
					guildId,
				);
				return members.map(m => new GuildMember(this.client, m, m.user!, guildId));
			},
			unban: async (guildId: string, memberId: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) => {
				await this.client.proxy.guilds(guildId).bans(memberId).delete({ reason, body });
			},
			ban: async (guildId: string, memberId: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) => {
				await this.client.proxy.guilds(guildId).bans(memberId).put({ reason, body });
				await this.client.cache.members?.removeIfNI('GuildBans', memberId, guildId);
			},
			kick: async (guildId: string, memberId: string, reason?: string) => {
				await this.client.proxy.guilds(guildId).members(memberId).delete({ reason });
				await this.client.cache.members?.removeIfNI('GuildMembers', memberId, guildId);
			},
			edit: async (guildId: string, memberId: string, body: RESTPatchAPIGuildMemberJSONBody, reason?: string) => {
				const member = await this.client.proxy.guilds(guildId).members(memberId).patch({ body, reason });
				await this.client.cache.members?.setIfNI('GuildMembers', memberId, guildId, member);
				return new GuildMember(this.client, member, member.user!, guildId);
			},
			add: async (guildId: string, memberId: string, body: RESTPutAPIGuildMemberJSONBody) => {
				const member = await this.client.proxy.guilds(guildId).members(memberId).put({
					body,
				});

				// Thanks dapi-types, fixed
				if (!member) {
					return;
				}

				await this.client.cache.members?.setIfNI('GuildMembers', member.user!.id, guildId, member);

				return new GuildMember(this.client, member, member.user!, guildId);
			},
			fetch: async (guildId: string, memberId: string, force = false) => {
				let member;
				if (!force) {
					member = await this.client.cache.members?.get(memberId, guildId);
					if (member) return member;
				}

				member = await this.client.proxy.guilds(guildId).members(memberId).get();
				await this.client.cache.members?.set(member.user!.id, guildId, member);
				return new GuildMember(this.client, member, member.user!, guildId);
			},

			list: async (guildId: string, query?: RESTGetAPIGuildMembersQuery, force = false) => {
				let members;
				if (!force) {
					members = (await this.client.cache.members?.values(guildId)) ?? [];
					if (members.length) return members;
				}
				members = await this.client.proxy.guilds(guildId).members.get({
					query,
				});
				await this.client.cache.members?.set(
					members.map(x => [x.user!.id, x]),
					guildId,
				);
				return members.map(m => new GuildMember(this.client, m, m.user!, guildId));
			},
			roles: this.roles,
		};
	}

	get roles() {
		return {
			add: async (guildId: string, memberId: string, id: string) => {
				await this.client.proxy.guilds(guildId).members(memberId).roles(id).put({});
			},
			remove: async (guildId: string, memberId: string, id: string) => {
				await this.client.proxy.guilds(guildId).members(memberId).roles(id).delete();
			},
		};
	}
}
