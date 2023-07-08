import type {
	GuildDefaultMessageNotifications, APIGuild,
	APIGuildWelcomeScreen, GuildExplicitContentFilter,
	GuildFeature, GuildNSFWLevel,
	GuildMFALevel, GuildPremiumTier,
	GuildSystemChannelFlags, GuildVerificationLevel, GatewayGuildCreateDispatchData,
	GuildHubType
} from '@biscuitland/common';
import type { Cache } from '..';
import { BaseResource } from './default/base';

export class Guilds extends BaseResource {
	namespace = 'guild';

	override async get(id: string): Promise<Guild | undefined> {
		const guild = await super.get(id);
		if (!guild) { return; }
		return new Guild(guild, this.cache);
	}

	override async items(): Promise<Guild[]> {
		const guilds = await super.items();
		return guilds.map(x => new Guild(x, this.cache));
	}

	override async remove(id: string) {

		await this.cache.adapter.remove((await Promise.all([
			this.cache.members.keys(id),
			this.cache.roles.keys(id),
			this.cache.channels.keys(id),
			this.cache.emojis.keys(id),
			this.cache.stickers.keys(id),
			this.cache.voiceStates.keys(id),
			this.cache.presences.keys(id),
			this.cache.threads.keys(id),
			this.cache.stageInstances.keys(id),
		])).flat());

		await this.cache.adapter.removeRelationship([
			this.cache.members.hashId(id),
			this.cache.roles.hashId(id),
			this.cache.channels.hashId(id),
			this.cache.emojis.hashId(id),
			this.cache.stickers.hashId(id),
			this.cache.voiceStates.hashId(id),
			this.cache.presences.hashId(id),
			this.cache.threads.hashId(id),
			this.cache.stageInstances.hashId(id),
		]);

		await super.remove(id);

	}

	override async set(id: string, data: any) {

		const bulkData: Parameters<Cache['bulkSet']>[0] = [];

		for (const member of data.members ?? []) {
			bulkData.push(['members', member, member.user.id, id]);
			bulkData.push(['users', member.user, member.user.id]);
			// await this.cache.members.set(member.user.id, id, member);
		}

		for (const role of data.roles ?? []) {
			bulkData.push(['roles', role, role.id, id]);
			// await this.cache.roles.set(role.id, id, role);
		}

		for (const channel of data.channels ?? []) {
			bulkData.push(['channels', channel, channel.id, id]);
			// await this.cache.channels.set(channel.id, id, channel);
		}

		for (const emoji of data.emojis ?? []) {
			bulkData.push(['emojis', emoji, emoji.id, id]);
			// await this.cache.emojis.set(emoji.id, id, emoji);
		}

		for (const sticker of data.stickers ?? []) {
			bulkData.push(['stickers', sticker, sticker.id, id]);
			// await this.cache.stickers.set(sticker.id, id, sticker);
		}

		for (const voiceState of data.voice_states ?? []) {
			bulkData.push(['voiceStates', voiceState, voiceState.user_id, id]);
			// await this.cache.voiceStates.set(voiceState.user_id, id, voiceState);
		}

		for (const presence of data.presences ?? []) {
			bulkData.push(['presences', presence, presence.user.id, id]);
			// await this.cache.presences.set(presence.user.id, id, presence);
		}

		for (const thread of data.threads ?? []) {
			bulkData.push(['threads', thread, thread.id, id]);
			// await this.cache.threads.set(thread.id, id, thread);
		}

		for (const instance of data.stage_instances ?? []) {
			bulkData.push(['stageInstances', instance, instance.id, id]);
			// await this.cache.threads.set(thread.id, id, thread);
		}

		delete data.members;
		delete data.roles;
		delete data.channels;
		delete data.emojis;
		delete data.stickers;
		delete data.voice_states;
		delete data.presences;
		delete data.threads;
		delete data.stage_instances;

		delete data.guild_hashes;

		// deprecated
		delete data.region;

		bulkData.push(['guilds', data, id]);

		await this.cache.bulkSet(bulkData);

		// await super.set(id, data);

	}
}

export class Guild implements PotoGuild {
	name: string;
	owner?: boolean | undefined;
	afk_timeout: 60 | 300 | 900 | 1800 | 3600;
	widget_enabled?: boolean | undefined;
	verification_level: GuildVerificationLevel;
	default_message_notifications: GuildDefaultMessageNotifications;
	explicit_content_filter: GuildExplicitContentFilter;
	features: GuildFeature[];
	mfa_level: GuildMFALevel;
	system_channel_flags: GuildSystemChannelFlags;
	large?: boolean | undefined;
	unavailable?: boolean | undefined;
	member_count?: number | undefined;
	max_presences?: number | null | undefined;
	max_members?: number | undefined;
	vanity_url_code: string | null;
	description: string | null;
	premium_tier: GuildPremiumTier;
	premium_subscription_count?: number | undefined;
	max_video_channel_users?: number | undefined;
	approximate_member_count?: number | undefined;
	approximate_presence_count?: number | undefined;
	nsfw_level: GuildNSFWLevel;
	premium_progress_bar_enabled: boolean;
	id: string;
	icon: string | null;
	icon_hash?: string | null | undefined;
	splash: string | null;
	discovery_splash: string | null;
	owner_id: string;
	permissions?: string | undefined;
	afk_channel_id: string | null;
	widget_channel_id?: string | null | undefined;
	application_id: string | null;
	system_channel_id: string | null;
	rules_channel_id: string | null;
	joined_at?: string | undefined;
	banner: string | null;
	preferred_locale: string;
	public_updates_channel_id: string | null;
	welcome_screen?: APIGuildWelcomeScreen | undefined;
	hub_type: GuildHubType | null;
	members: {
		get(id: string): ReturnType<Cache['members']['get']>;
		items(): ReturnType<Cache['members']['items']>;
	};

	roles: {
		get(id: string): ReturnType<Cache['roles']['get']>;
		items(): ReturnType<Cache['roles']['items']>;
	};

	channels: {
		get(id: string): ReturnType<Cache['channels']['get']>;
		items(): ReturnType<Cache['channels']['items']>;
	};

	emojis: {
		get(id: string): ReturnType<Cache['emojis']['get']>;
		items(): ReturnType<Cache['emojis']['items']>;
	};

	stickers: {
		get(id: string): ReturnType<Cache['stickers']['get']>;
		items(): ReturnType<Cache['stickers']['items']>;
	};

	voiceStates: {
		get(id: string): ReturnType<Cache['voiceStates']['get']>;
		items(): ReturnType<Cache['voiceStates']['items']>;
	};

	presences: {
		get(id: string): ReturnType<Cache['presences']['get']>;
		items(): ReturnType<Cache['presences']['items']>;
	};

	threads: {
		get(id: string): ReturnType<Cache['threads']['get']>;
		items(): ReturnType<Cache['threads']['items']>;
	};

	stageInstances: {
		get(id: string): ReturnType<Cache['stageInstances']['get']>;
		items(): ReturnType<Cache['stageInstances']['items']>;
	};

	constructor(guild: PotoGuild | GatewayGuildCreateDispatchData, cache: Cache) {
		this.name = guild.name;
		this.owner = guild.owner;
		this.afk_timeout = guild.afk_timeout;
		this.widget_enabled = guild.widget_enabled;
		this.verification_level = guild.verification_level;
		this.default_message_notifications = guild.default_message_notifications;
		this.explicit_content_filter = guild.explicit_content_filter;
		this.features = guild.features;
		this.mfa_level = guild.mfa_level;
		this.system_channel_flags = guild.system_channel_flags;
		if ('joined_at' in guild) {
			this.large = guild.large;
			this.unavailable = guild.unavailable;
			this.member_count = guild.member_count;
			this.joined_at = guild.joined_at;
		}
		this.max_presences = guild.max_presences;
		this.vanity_url_code = guild.vanity_url_code;
		this.description = guild.description;
		this.premium_tier = guild.premium_tier;
		this.premium_subscription_count = guild.premium_subscription_count;
		this.max_video_channel_users = guild.max_video_channel_users;
		this.approximate_member_count = guild.approximate_member_count;
		this.approximate_presence_count = guild.approximate_presence_count;
		this.nsfw_level = guild.nsfw_level;
		this.premium_progress_bar_enabled = guild.premium_progress_bar_enabled;
		this.id = guild.id;
		this.icon = guild.icon;
		this.icon_hash = guild.icon_hash;
		this.splash = guild.splash;
		this.discovery_splash = guild.discovery_splash;
		this.owner_id = guild.owner_id;
		this.permissions = guild.permissions;
		this.afk_channel_id = guild.afk_channel_id;
		this.widget_channel_id = guild.widget_channel_id;
		this.application_id = guild.application_id;
		this.system_channel_id = guild.system_channel_id;
		this.rules_channel_id = guild.rules_channel_id;
		this.banner = guild.banner;
		this.preferred_locale = guild.preferred_locale;
		this.public_updates_channel_id = guild.public_updates_channel_id;
		this.welcome_screen = guild.welcome_screen;
		this.hub_type = guild.hub_type;
		this.safety_alerts_channel_id = guild.safety_alerts_channel_id;

		this.members = {
			get(id: string) {
				return cache.members.get(id, guild.id);
			},
			items() {
				return cache.members.items(guild.id);
			}
		};

		this.roles = {
			get(id: string) {
				return cache.roles.get(id, guild.id);
			},
			items() {
				return cache.roles.items(guild.id);
			}
		};

		this.channels = {
			get(id: string) {
				return cache.channels.get(id, guild.id);
			},
			items() {
				return cache.channels.items(guild.id);
			}
		};

		this.emojis = {
			get(id: string) {
				return cache.emojis.get(id, guild.id);
			},
			items() {
				return cache.emojis.items(guild.id);
			}
		};

		this.stickers = {
			get(id: string) {
				return cache.stickers.get(id, guild.id);
			},
			items() {
				return cache.stickers.items(guild.id);
			}
		};

		this.voiceStates = {
			get(id: string) {
				return cache.voiceStates.get(id, guild.id);
			},
			items() {
				return cache.voiceStates.items(guild.id);
			}
		};

		this.presences = {
			get(id: string) {
				return cache.presences.get(id, guild.id);
			},
			items() {
				return cache.presences.items(guild.id);
			}
		};

		this.threads = {
			get(id: string) {
				return cache.threads.get(id, guild.id);
			},
			items() {
				return cache.threads.items(guild.id);
			}
		};

		this.stageInstances = {
			get(id: string) {
				return cache.stageInstances.get(id, guild.id);
			},
			items() {
				return cache.stageInstances.items(guild.id);
			}
		};


	}

	max_stage_video_channel_users?: number | undefined;
	safety_alerts_channel_id: string | null;
}

export type PotoGuild = Omit<APIGuild,
	'members' |
	'roles' |
	'channels' |
	'emojis' |
	'stickers' |
	'voice_states' |
	'presences' |
	'threads' |
	'stage_instances' |
	'guild_hashes' |
	'region'
>;
