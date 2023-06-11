import type { GatewayChannelCreateDispatchData, GatewayChannelDeleteDispatchData, GatewayChannelPinsUpdateDispatchData, GatewayChannelUpdateDispatchData, GatewayGuildBanAddDispatchData, GatewayGuildBanRemoveDispatchData, GatewayGuildCreateDispatchData, GatewayGuildEmojisUpdateDispatchData, GatewayGuildMemberAddDispatchData, GatewayGuildMemberRemoveDispatchData, GatewayGuildMemberUpdateDispatchData, GatewayGuildRoleCreateDispatchData, GatewayGuildRoleDeleteDispatchData, GatewayGuildRoleUpdateDispatchData, GatewayGuildStickersUpdateDispatchData, GatewayGuildUpdateDispatchData, GatewayInteractionCreateDispatchData, GatewayInviteDeleteDispatchData, GatewayMessageCreateDispatchData, GatewayMessageDeleteBulkDispatchData, GatewayMessageDeleteDispatchData, GatewayMessageReactionAddDispatchData, GatewayMessageReactionRemoveDispatchData, GatewayMessageReactionRemoveEmojiDispatchData, GatewayPresenceUpdateDispatchData, GatewayStageInstanceCreateDispatchData, GatewayStageInstanceDeleteDispatchData, GatewayThreadCreateDispatchData, GatewayThreadDeleteDispatchData, GatewayThreadListSyncDispatchData, GatewayThreadMemberUpdateDispatchData, GatewayThreadMembersUpdateDispatchData, GatewayThreadUpdateDispatchData, GatewayUserUpdateDispatchData, GatewayWebhooksUpdateDispatchData } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { AnonymousGuild, Guild, GuildMember, Message, Role, Sticker, User, channelFactory, interactionFactory } from '@potoland/structures';

export const CHANNEL_CREATE = (rest: BiscuitREST, data: GatewayChannelCreateDispatchData) => {
	return channelFactory(rest, data);
};

export const CHANNEL_DELETE = (rest: BiscuitREST, data: GatewayChannelDeleteDispatchData) => {
	return channelFactory(rest, data);
};

export const CHANNEL_UPDATE = (rest: BiscuitREST, data: GatewayChannelUpdateDispatchData) => {
	return channelFactory(rest, data);
};

export const CHANNEL_PINS_UPDATE = (_rest: BiscuitREST, data: GatewayChannelPinsUpdateDispatchData) => {
	return data;
};

export const GUILD_BAN_ADD = (_rest: BiscuitREST, data: GatewayGuildBanAddDispatchData) => {
	return data;
};

export const GUILD_BAN_REMOVE = (_rest: BiscuitREST, data: GatewayGuildBanRemoveDispatchData) => {
	return data;
};

export const GUILD_CREATE = (rest: BiscuitREST, data: GatewayGuildCreateDispatchData) => {
	return new Guild(rest, data);
};

export const GUILD_DELETE = (rest: BiscuitREST, data: GatewayGuildCreateDispatchData): AnonymousGuild => {
	return new AnonymousGuild(rest, data);
};

export const GUILD_EMOJIS_UPDATE = (_rest: BiscuitREST, data: GatewayGuildEmojisUpdateDispatchData) => {
	return data;
};

export const GUILD_MEMBER_ADD = (rest: BiscuitREST, data: GatewayGuildMemberAddDispatchData) => {
	return new GuildMember(rest, data, data.user!, data.guild_id);
};

export const GUILD_MEMBER_REMOVE = (_rest: BiscuitREST, data: GatewayGuildMemberRemoveDispatchData) => {
	return data;
};

export const GUILD_MEMBER_UPDATE = (rest: BiscuitREST, data: GatewayGuildMemberUpdateDispatchData) => {
	return new GuildMember(rest, data, data.user!, data.guild_id);
};

export const GUILD_ROLE_CREATE = (rest: BiscuitREST, data: GatewayGuildRoleCreateDispatchData) => {
	return new Role(rest, data.role, data.guild_id);
};

export const GUILD_ROLE_DELETE = (_rest: BiscuitREST, data: GatewayGuildRoleDeleteDispatchData) => {
	return data;
};

export const GUILD_ROLE_UPDATE = (rest: BiscuitREST, data: GatewayGuildRoleUpdateDispatchData) => {
	return new Role(rest, data.role, data.guild_id);
};

export const GUILD_STICKERS_UPDATE = (rest: BiscuitREST, data: GatewayGuildStickersUpdateDispatchData) => {
	return data.stickers.map(x => new Sticker(rest, x));
	// pa q un Map, nunca vas a hacer un .get en este evento xdxd, lo mas que puedes hacer es un map y eso lo tiene el array
	// return data.stickers
	// 	.reduce((acc, val) => acc.set(val.id, new Sticker(rest, val)), new Map<string, Sticker>());
};

export const GUILD_UPDATE = (rest: BiscuitREST, data: GatewayGuildUpdateDispatchData) => {
	return new Guild(rest, data);
};

export const INTERACTION_CREATE = (rest: BiscuitREST, data: GatewayInteractionCreateDispatchData) => {
	return interactionFactory(rest, data);
};

// export const INVITE_CREATE = (rest: BiscuitREST, data: GatewayInviteCreateDispatchData) => {
// 	return new Invite(rest, data);
// };

export const INVITE_DELETE = (_rest: BiscuitREST, data: GatewayInviteDeleteDispatchData) => {
	return data;
};

export const MESSAGE_CREATE = (rest: BiscuitREST, data: GatewayMessageCreateDispatchData) => {
	return new Message(rest, data);
};

export const MESSAGE_DELETE = (_rest: BiscuitREST, data: GatewayMessageDeleteDispatchData) => {
	return data;
};

export const MESSAGE_DELETE_BULK = (_rest: BiscuitREST, data: GatewayMessageDeleteBulkDispatchData) => {
	return data;
};

export const MESSAGE_REACTION_ADD = (_rest: BiscuitREST, data: GatewayMessageReactionAddDispatchData) => {
	return data;
};

export const MESSAGE_REACTION_REMOVE = (_rest: BiscuitREST, data: GatewayMessageReactionRemoveDispatchData) => {
	return data;
};

// export const MESSAGE_REACTION_REMOVE_ALL = (_rest: BiscuitREST, data: GatewayMessageReactionRemoveAllDispatchData) => {
// 	return data;
// };

export const MESSAGE_REACTION_REMOVE_EMOJI = (_rest: BiscuitREST, data: GatewayMessageReactionRemoveEmojiDispatchData) => {
	return data;
};

// export const MESSAGE_UPDATE = (rest: BiscuitREST, data: GatewayMessageUpdateDispatchData) => {
// 	return new Message(rest, data);
// };

export const PRESENCE_UPDATE = (_rest: BiscuitREST, data: GatewayPresenceUpdateDispatchData) => {
	return data;
};

export const STAGE_INSTANCE_CREATE = (_rest: BiscuitREST, data: GatewayStageInstanceCreateDispatchData) => {
	return data;
};

export const STAGE_INSTANCE_DELETE = (_rest: BiscuitREST, data: GatewayStageInstanceDeleteDispatchData) => {
	return data;
};

export const STAGE_INSTANCE_UPDATE = (_rest: BiscuitREST, data: GatewayStageInstanceDeleteDispatchData) => {
	return data;
};

export const THREAD_CREATE = (rest: BiscuitREST, data: GatewayThreadCreateDispatchData) => {
	return channelFactory(rest, data);
};

export const THREAD_DELETE = (rest: BiscuitREST, data: GatewayThreadDeleteDispatchData) => {
	return channelFactory(rest, data);
};

export const THREAD_LIST_SYNC = (_rest: BiscuitREST, data: GatewayThreadListSyncDispatchData) => {
	return data;
};

export const THREAD_MEMBER_UPDATE = (_rest: BiscuitREST, data: GatewayThreadMemberUpdateDispatchData) => {
	return data;
};

export const THREAD_MEMBERS_UPDATE = (_rest: BiscuitREST, data: GatewayThreadMembersUpdateDispatchData) => {
	return data;
};

export const THREAD_UPDATE = (rest: BiscuitREST, data: GatewayThreadUpdateDispatchData) => {
	return channelFactory(rest, data);
};

export const USER_UPDATE = (rest: BiscuitREST, data: GatewayUserUpdateDispatchData) => {
	return new User(rest, data);
};

export const WEBHOOKS_UPDATE = (_rest: BiscuitREST, data: GatewayWebhooksUpdateDispatchData) => {
	return data;
};
