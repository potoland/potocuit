import type {
	APIMessage, GatewayApplicationCommandPermissionsUpdateDispatchData, GatewayAutoModerationActionExecutionDispatchData, GatewayAutoModerationRuleCreateDispatchData, GatewayAutoModerationRuleDeleteDispatchData, GatewayAutoModerationRuleUpdateDispatchData, GatewayChannelCreateDispatchData,
	GatewayChannelDeleteDispatchData, GatewayChannelPinsUpdateDispatchData,
	GatewayChannelUpdateDispatchData, GatewayGuildAuditLogEntryCreateDispatchData, GatewayGuildBanAddDispatchData,
	GatewayGuildBanRemoveDispatchData, GatewayGuildCreateDispatchData,
	GatewayGuildEmojisUpdateDispatchData, GatewayGuildIntegrationsUpdateDispatchData, GatewayGuildMemberAddDispatchData,
	GatewayGuildMemberRemoveDispatchData, GatewayGuildMemberUpdateDispatchData,
	GatewayGuildMembersChunkDispatchData,
	GatewayGuildRoleCreateDispatchData, GatewayGuildRoleDeleteDispatchData,
	GatewayGuildRoleUpdateDispatchData, GatewayGuildScheduledEventCreateDispatchData, GatewayGuildScheduledEventDeleteDispatchData, GatewayGuildScheduledEventUpdateDispatchData, GatewayGuildScheduledEventUserAddDispatchData, GatewayGuildScheduledEventUserRemoveDispatchData, GatewayGuildStickersUpdateDispatchData,
	GatewayGuildUpdateDispatchData, GatewayIntegrationCreateDispatchData, GatewayIntegrationDeleteDispatchData, GatewayIntegrationUpdateDispatchData, GatewayInteractionCreateDispatchData,
	GatewayInviteCreateDispatchData,
	GatewayInviteDeleteDispatchData, GatewayMessageCreateDispatchData,
	GatewayMessageDeleteBulkDispatchData, GatewayMessageDeleteDispatchData,
	GatewayMessageReactionAddDispatchData,
	GatewayMessageReactionRemoveDispatchData, GatewayMessageReactionRemoveEmojiDispatchData,
	GatewayMessageUpdateDispatchData, GatewayPresenceUpdateDispatchData,
	GatewayReadyDispatchData,
	GatewayResumedDispatch,
	GatewayStageInstanceCreateDispatchData, GatewayStageInstanceDeleteDispatchData,
	GatewayThreadCreateDispatchData, GatewayThreadDeleteDispatchData,
	GatewayThreadListSyncDispatchData, GatewayThreadMemberUpdateDispatchData,
	GatewayThreadMembersUpdateDispatchData, GatewayThreadUpdateDispatchData,
	GatewayTypingStartDispatchData,
	GatewayUserUpdateDispatchData,
	GatewayVoiceServerUpdateDispatchData, GatewayVoiceStateUpdateDispatchData, GatewayWebhooksUpdateDispatchData,
	GatewayMessageReactionRemoveAllDispatchData
} from '@biscuitland/common';
import { toCamelCase } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '@potoland/structures';
import { AnonymousGuild, AutoModerationRule, ClientUser, ExtendedInvite, Guild, GuildEmoji, GuildMember, Message, Role, Sticker, User, channelFactory, interactionFactory } from '@potoland/structures';

export type DropT<T, R> = {
	[P in keyof T as T[P] extends R ? never : P]: T[P] extends R ? never : T[P];
};

export type DropTI<T, U> = {
	[P in keyof T as U extends T[P] ? never : P]: U extends T[P] ? never : T[P];
};

export type KeepT<T, R> = {
	[P in keyof T as T[P] extends R ? P : never]: T[P] extends R ? T[P] : never;
};

export type KeepTI<T, U> = {
	[P in keyof T as U extends T[P] ? P : never]: U extends T[P] ? T[P] : never;
};

export type Clean<T> = DropT<T, never>;

export type Identify<T> = T extends infer U ? {
	[K in keyof U]: U[K];
} : never;

export type PartialAvoid<U, T> =
	Identify<KeepT<T, U> & Partial<T>>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type PartialClass<T> = PartialAvoid<Function, T>;

export const APPLICATION_COMMAND_PERMISSIONS_UPDATE = (_rest: BiscuitREST, _cache: Cache, data: GatewayApplicationCommandPermissionsUpdateDispatchData) => {
	return data;
};

export const AUTO_MODERATION_ACTION_EXECUTION = (_rest: BiscuitREST, _cache: Cache, data: GatewayAutoModerationActionExecutionDispatchData) => {
	return data;
};

export const AUTO_MODERATION_RULE_CREATE = (rest: BiscuitREST, cache: Cache, data: GatewayAutoModerationRuleCreateDispatchData) => {
	return new AutoModerationRule(rest, cache, data);
};

export const AUTO_MODERATION_RULE_DELETE = (rest: BiscuitREST, cache: Cache, data: GatewayAutoModerationRuleDeleteDispatchData) => {
	return new AutoModerationRule(rest, cache, data);
};

export const AUTO_MODERATION_RULE_UPDATE = (rest: BiscuitREST, cache: Cache, data: GatewayAutoModerationRuleUpdateDispatchData) => {
	return new AutoModerationRule(rest, cache, data);
};

export const CHANNEL_CREATE = (rest: BiscuitREST, cache: Cache, data: GatewayChannelCreateDispatchData) => {
	return channelFactory(rest, cache, data);
};

export const CHANNEL_DELETE = (rest: BiscuitREST, cache: Cache, data: GatewayChannelDeleteDispatchData) => {
	return channelFactory(rest, cache, data);
};

export const CHANNEL_PINS_UPDATE = (_rest: BiscuitREST, _cache: Cache, data: GatewayChannelPinsUpdateDispatchData) => {
	return data;
};

export const CHANNEL_UPDATE = (rest: BiscuitREST, cache: Cache, data: GatewayChannelUpdateDispatchData) => {
	return channelFactory(rest, cache, data);
};

export const GUILD_AUDIT_LOG_ENTRY_CREATE = (_rest: BiscuitREST, _cache: Cache, data: GatewayGuildAuditLogEntryCreateDispatchData) => {
	return data;
};

export const GUILD_BAN_ADD = (rest: BiscuitREST, cache: Cache, data: GatewayGuildBanAddDispatchData) => {
	return { ...data, user: new User(rest, cache, data.user) };
};

export const GUILD_BAN_REMOVE = (rest: BiscuitREST, cache: Cache, data: GatewayGuildBanRemoveDispatchData) => {
	return { ...toCamelCase(data), user: new User(rest, cache, data.user) };
};

export const GUILD_CREATE = (rest: BiscuitREST, cache: Cache, data: GatewayGuildCreateDispatchData) => {
	return new Guild(rest, cache, data);
};

export const GUILD_DELETE = (rest: BiscuitREST, cache: Cache, data: GatewayGuildCreateDispatchData): AnonymousGuild => {
	return new AnonymousGuild(rest, cache, data);
};

export const GUILD_EMOJIS_UPDATE = (rest: BiscuitREST, cache: Cache, data: GatewayGuildEmojisUpdateDispatchData) => {
	return { ...toCamelCase(data), emojis: data.emojis.map(x => new GuildEmoji(rest, cache, x as any, data.guild_id)) };
};

export const GUILD_INTEGRATIONS_UPDATE = (_rest: BiscuitREST, _cache: Cache, data: GatewayGuildIntegrationsUpdateDispatchData) => {
	return data;
};

export const GUILD_MEMBER_ADD = (rest: BiscuitREST, cache: Cache, data: GatewayGuildMemberAddDispatchData) => {
	return new GuildMember(rest, cache, data, data.user!, data.guild_id);
};

export const GUILD_MEMBER_REMOVE = (rest: BiscuitREST, cache: Cache, data: GatewayGuildMemberRemoveDispatchData) => {
	return { ...toCamelCase(data), user: new User(rest, cache, data.user) };
};

export const GUILD_MEMBERS_CHUNK = (rest: BiscuitREST, cache: Cache, data: GatewayGuildMembersChunkDispatchData) => {
	return {
		...toCamelCase(data),
		members: data.members.map(x => new GuildMember(rest, cache, x, x.user!, data.guild_id))
	};
};

export const GUILD_MEMBER_UPDATE = (rest: BiscuitREST, cache: Cache, data: GatewayGuildMemberUpdateDispatchData) => {
	return new GuildMember(rest, cache, data, data.user!, data.guild_id);
};

export const GUILD_SCHEDULED_EVENT_CREATE = (_rest: BiscuitREST, _cache: Cache, data: GatewayGuildScheduledEventCreateDispatchData) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_UPDATE = (_rest: BiscuitREST, _cache: Cache, data: GatewayGuildScheduledEventUpdateDispatchData) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_DELETE = (_rest: BiscuitREST, _cache: Cache, data: GatewayGuildScheduledEventDeleteDispatchData) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_USER_ADD = (_rest: BiscuitREST, _cache: Cache, data: GatewayGuildScheduledEventUserAddDispatchData) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_USER_REMOVE = (_rest: BiscuitREST, _cache: Cache, data: GatewayGuildScheduledEventUserRemoveDispatchData) => {
	return toCamelCase(data);
};

export const GUILD_ROLE_CREATE = (rest: BiscuitREST, cache: Cache, data: GatewayGuildRoleCreateDispatchData) => {
	return new Role(rest, cache, data.role, data.guild_id);
};

export const GUILD_ROLE_DELETE = (_rest: BiscuitREST, _cache: Cache, data: GatewayGuildRoleDeleteDispatchData) => {
	return toCamelCase(data);
};

export const GUILD_ROLE_UPDATE = (rest: BiscuitREST, cache: Cache, data: GatewayGuildRoleUpdateDispatchData) => {
	return new Role(rest, cache, data.role, data.guild_id);
};

export const GUILD_STICKERS_UPDATE = (rest: BiscuitREST, cache: Cache, data: GatewayGuildStickersUpdateDispatchData) => {

	return {
		...toCamelCase(data),
		stickers: data.stickers.map(x => new Sticker(rest, cache, x))
	};
};

export const GUILD_UPDATE = (rest: BiscuitREST, cache: Cache, data: GatewayGuildUpdateDispatchData) => {
	return new Guild(rest, cache, data);
};

export const INTEGRATION_CREATE = (rest: BiscuitREST, cache: Cache, data: GatewayIntegrationCreateDispatchData) => {
	return data.user ? {
		...toCamelCase(data),
		user: new User(rest, cache, data.user!)
	} : toCamelCase(data);
};

export const INTEGRATION_UPDATE = (rest: BiscuitREST, cache: Cache, data: GatewayIntegrationUpdateDispatchData) => {
	return data.user ? {
		...toCamelCase(data),
		user: new User(rest, cache, data.user!)
	} : toCamelCase(data);
};

export const INTEGRATION_DELETE = (_rest: BiscuitREST, _cache: Cache, data: GatewayIntegrationDeleteDispatchData) => {
	return toCamelCase(data);
};

export const INTERACTION_CREATE = (rest: BiscuitREST, cache: Cache, data: GatewayInteractionCreateDispatchData) => {
	return interactionFactory(rest, cache, data);
};

export const INVITE_CREATE = (rest: BiscuitREST, cache: Cache, data: GatewayInviteCreateDispatchData) => {
	return new ExtendedInvite(rest, cache, data as any);
};

export const INVITE_DELETE = (_rest: BiscuitREST, _cache: Cache, data: GatewayInviteDeleteDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_CREATE = (rest: BiscuitREST, cache: Cache, data: GatewayMessageCreateDispatchData) => {
	return new Message(rest, cache, data);
};

export const MESSAGE_DELETE = (_rest: BiscuitREST, _cache: Cache, data: GatewayMessageDeleteDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_DELETE_BULK = (_rest: BiscuitREST, _cache: Cache, data: GatewayMessageDeleteBulkDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_ADD = (_rest: BiscuitREST, _cache: Cache, data: GatewayMessageReactionAddDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE = (_rest: BiscuitREST, _cache: Cache, data: GatewayMessageReactionRemoveDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE_ALL = (_rest: BiscuitREST, _cache: Cache, data: GatewayMessageReactionRemoveAllDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE_EMOJI = (_rest: BiscuitREST, _cache: Cache, data: GatewayMessageReactionRemoveEmojiDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_UPDATE = (rest: BiscuitREST, cache: Cache, data: GatewayMessageUpdateDispatchData): PartialClass<Message> => {
	return new Message(rest, cache, data as unknown as APIMessage);
};

export const PRESENCE_UPDATE = (_rest: BiscuitREST, _cache: Cache, data: GatewayPresenceUpdateDispatchData) => {
	return toCamelCase(data);
};

export const READY = (rest: BiscuitREST, cache: Cache, data: GatewayReadyDispatchData) => {
	return new ClientUser(rest, cache, data.user, data.application);
};

export const RESUMED = (_rest: BiscuitREST, _cache: Cache, _data: GatewayResumedDispatch['d']) => {
	return;
};

export const STAGE_INSTANCE_CREATE = (_rest: BiscuitREST, _cache: Cache, data: GatewayStageInstanceCreateDispatchData) => {
	return toCamelCase(data);
};

export const STAGE_INSTANCE_DELETE = (_rest: BiscuitREST, _cache: Cache, data: GatewayStageInstanceDeleteDispatchData) => {
	return toCamelCase(data);
};

export const STAGE_INSTANCE_UPDATE = (_rest: BiscuitREST, _cache: Cache, data: GatewayStageInstanceDeleteDispatchData) => {
	return toCamelCase(data);
};

export const THREAD_CREATE = (rest: BiscuitREST, cache: Cache, data: GatewayThreadCreateDispatchData) => {
	return channelFactory(rest, cache, data);
};

export const THREAD_DELETE = (rest: BiscuitREST, cache: Cache, data: GatewayThreadDeleteDispatchData) => {
	return channelFactory(rest, cache, data);
};

export const THREAD_LIST_SYNC = (_rest: BiscuitREST, _cache: Cache, data: GatewayThreadListSyncDispatchData) => {
	return toCamelCase(data);
};

export const THREAD_MEMBER_UPDATE = (_rest: BiscuitREST, _cache: Cache, data: GatewayThreadMemberUpdateDispatchData) => {
	return toCamelCase(data);
};

export const THREAD_MEMBERS_UPDATE = (_rest: BiscuitREST, _cache: Cache, data: GatewayThreadMembersUpdateDispatchData) => {
	return toCamelCase(data);
};

export const THREAD_UPDATE = (rest: BiscuitREST, cache: Cache, data: GatewayThreadUpdateDispatchData) => {
	return channelFactory(rest, cache, data);
};

export const TYPING_START = (rest: BiscuitREST, cache: Cache, data: GatewayTypingStartDispatchData) => {
	return data.member ? {
		...toCamelCase(data),
		member: new GuildMember(rest, cache, data.member, data.member.user!, data.guild_id!)
	} : toCamelCase(data);
};

export const USER_UPDATE = (rest: BiscuitREST, cache: Cache, data: GatewayUserUpdateDispatchData) => {
	return new User(rest, cache, data);
};

export const VOICE_SERVER_UPDATE = (_rest: BiscuitREST, _cache: Cache, data: GatewayVoiceServerUpdateDispatchData) => {
	return toCamelCase(data);
};

export const VOICE_STATE_UPDATE = (rest: BiscuitREST, cache: Cache, data: GatewayVoiceStateUpdateDispatchData) => {
	return data.member?.user ? {
		...toCamelCase(data),
		member: new GuildMember(rest, cache, data.member, data.member?.user, data.guild_id!)
	} : toCamelCase(data);
};

export const WEBHOOKS_UPDATE = (_rest: BiscuitREST, _cache: Cache, data: GatewayWebhooksUpdateDispatchData) => {
	return toCamelCase(data);
};
