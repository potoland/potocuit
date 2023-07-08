export * from './extra';
export * from './AnnouncementChannel';
export * from './AnonymousGuild';
export * from './AutoModerationRule';
export * from './CategoryChannel';
export * from './ClientUser';
export * from './DMChannel';
export * from './ForumChannel';
export * from './Guild';
export * from './GuildEmoji';
export * from './GuildMember';
export * from './GuildPreview';
export * from './GuildRole';
export * from './Interaction';
export * from './Invite';
export * from './Message';
export * from './Sticker';
export * from './ThreadChannel';
export * from './User';
export * from './VoiceChannel';
export * from './Webhook';
export * from './miscellaneous';
export * from './util/mod';
export * from './cache';

export function channelLink(channelId: string, guildId?: string) {
	return `https://discord.com/channels/${guildId ?? '@me'}/${channelId}`;
}
// export * from './ThreadMember';
