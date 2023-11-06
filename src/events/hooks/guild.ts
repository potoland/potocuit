import type {
	GatewayGuildAuditLogEntryCreateDispatchData,
	GatewayGuildBanAddDispatchData,
	GatewayGuildBanRemoveDispatchData,
	GatewayGuildCreateDispatchData,
	GatewayGuildEmojisUpdateDispatchData,
	GatewayGuildIntegrationsUpdateDispatchData,
	GatewayGuildMemberAddDispatchData,
	GatewayGuildMemberRemoveDispatchData,
	GatewayGuildMemberUpdateDispatchData,
	GatewayGuildMembersChunkDispatchData,
	GatewayGuildRoleCreateDispatchData,
	GatewayGuildRoleDeleteDispatchData,
	GatewayGuildRoleUpdateDispatchData,
	GatewayGuildScheduledEventCreateDispatchData,
	GatewayGuildScheduledEventDeleteDispatchData,
	GatewayGuildScheduledEventUpdateDispatchData,
	GatewayGuildScheduledEventUserAddDispatchData,
	GatewayGuildScheduledEventUserRemoveDispatchData,
	GatewayGuildStickersUpdateDispatchData,
	GatewayGuildUpdateDispatchData,
} from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../../cache';

import { toCamelCase } from '@biscuitland/common';
import { AnonymousGuild } from '../../structures/AnonymousGuild';
import { Guild } from '../../structures/Guild';
import { GuildEmoji } from '../../structures/GuildEmoji';
import { GuildMember } from '../../structures/GuildMember';
import { Sticker } from '../../structures/Sticker';
import { User } from '../../structures/User';
import { GuildRole } from '../../structures/GuildRole';


export const GUILD_AUDIT_LOG_ENTRY_CREATE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayGuildAuditLogEntryCreateDispatchData
) => {
	return toCamelCase(data);
};

export const GUILD_BAN_ADD = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayGuildBanAddDispatchData
) => {
	return { ...toCamelCase(data), user: new User(rest, cache, data.user) };
};

export const GUILD_BAN_REMOVE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayGuildBanRemoveDispatchData
) => {
	return { ...toCamelCase(data), user: new User(rest, cache, data.user) };
};

export const GUILD_CREATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayGuildCreateDispatchData
) => {
	return new Guild(rest, cache, data);
};

export const GUILD_DELETE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayGuildCreateDispatchData
): AnonymousGuild => {
	return new AnonymousGuild(rest, cache, data);
};

export const GUILD_EMOJIS_UPDATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayGuildEmojisUpdateDispatchData
) => {
	return {
		...toCamelCase(data),
		emojis: data.emojis.map(
			x => new GuildEmoji(rest, cache, x as any, data.guild_id)
		),
	};
};

export const GUILD_INTEGRATIONS_UPDATE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayGuildIntegrationsUpdateDispatchData
) => {
	return data;
};

export const GUILD_MEMBER_ADD = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayGuildMemberAddDispatchData
) => {
	return new GuildMember(rest, cache, data, data.user!, data.guild_id);
};

export const GUILD_MEMBER_REMOVE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayGuildMemberRemoveDispatchData
) => {
	return { ...toCamelCase(data), user: new User(rest, cache, data.user) };
};

export const GUILD_MEMBERS_CHUNK = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayGuildMembersChunkDispatchData
) => {
	return {
		...toCamelCase(data),
		members: data.members.map(
			x => new GuildMember(rest, cache, x, x.user!, data.guild_id)
		),
	};
};

export const GUILD_MEMBER_UPDATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayGuildMemberUpdateDispatchData
) => {
	if (!data.user) { return; }
	return new GuildMember(rest, cache, data, data.user, data.guild_id);
};

export const GUILD_SCHEDULED_EVENT_CREATE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayGuildScheduledEventCreateDispatchData
) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_UPDATE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayGuildScheduledEventUpdateDispatchData
) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_DELETE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayGuildScheduledEventDeleteDispatchData
) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_USER_ADD = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayGuildScheduledEventUserAddDispatchData
) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_USER_REMOVE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayGuildScheduledEventUserRemoveDispatchData
) => {
	return toCamelCase(data);
};

export const GUILD_ROLE_CREATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayGuildRoleCreateDispatchData
) => {
	return new GuildRole(rest, cache, data.role, data.guild_id);
};

export const GUILD_ROLE_DELETE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayGuildRoleDeleteDispatchData
) => {
	return toCamelCase(data);
};

export const GUILD_ROLE_UPDATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayGuildRoleUpdateDispatchData
) => {
	return new GuildRole(rest, cache, data.role, data.guild_id);
};

export const GUILD_STICKERS_UPDATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayGuildStickersUpdateDispatchData
) => {
	return {
		...toCamelCase(data),
		stickers: data.stickers.map(x => new Sticker(rest, cache, x)),
	};
};

export const GUILD_UPDATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayGuildUpdateDispatchData
) => {
	return new Guild(rest, cache, data);
};
