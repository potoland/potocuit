import type {
	DiscordEmoji, DiscordReady, DiscordSticker,
} from '@biscuitland/api-types';
import type { Shard } from '@biscuitland/ws';

import type { Adapter } from './adapters';

import { Users } from './resources/users';
import { Guilds } from './resources/guilds';

import { Roles } from './resources/roles';
import { Emojis } from './resources/emojis';
import { Threads } from './resources/threads';
import { Members } from './resources/members';
import { Channels } from './resources/channels';
import { Stickers } from './resources/stickers';
import { Presences } from './resources/presence';
import { VoiceStates } from './resources/voice-states';
import { StageInstances } from './resources/stage-instances';

type GuildBased =
	'roles' |
	'emojis' |
	'threads' |
	'members' |
	'channels' |
	'stickers' |
	'presences' |
	'voiceStates' |
	'stageInstances';

// ClientBased
type NonGuildBased =
	'users' |
	'guilds';

export * from './adapters/index';

export type CachedEvents = 'READY'
	| 'GUILD_CREATE'
	| 'GUILD_UPDATE'
	| 'GUILD_DELETE'

	| 'CHANNEL_CREATE'
	| 'CHANNEL_UPDATE'
	| 'CHANNEL_DELETE'

	| 'GUILD_ROLE_CREATE'
	| 'GUILD_ROLE_UPDATE'
	| 'GUILD_ROLE_DELETE'

	| 'GUILD_EMOJIS_UPDATE'

	| 'GUILD_STICKERS_UPDATE'

	| 'GUILD_MEMBER_ADD'
	| 'GUILD_MEMBER_UPDATE'
	| 'GUILD_MEMBER_REMOVE'

	| 'MESSAGE_CREATE'

	| 'PRESENCE_UPDATE'

	| 'THREAD_DELETE'
	| 'THREAD_CREATE'
	| 'THREAD_UPDATE'

	| 'USER_UPDATE'

	| 'VOICE_STATE_UPDATE'

	| 'STAGE_INSTANCE_CREATE'
	| 'STAGE_INSTANCE_UPDATE'
	| 'STAGE_INSTANCE_DELETE';

export class Cache {
	adapter: Adapter;

	// non-guild based
	users: Users;
	guilds: Guilds;

	// guild based
	roles: Roles;
	emojis: Emojis;
	threads: Threads;
	members: Members;
	channels: Channels;
	stickers: Stickers;
	presences: Presences;
	voiceStates: VoiceStates;
	stageInstances: StageInstances;

	constructor(adapter: Adapter, private disabledEvents: string[] = []) {
		this.adapter = adapter;

		// non-guild based
		this.users = new Users(this);
		this.guilds = new Guilds(this);

		// guild based
		this.members = new Members(this);
		this.roles = new Roles(this);
		this.channels = new Channels(this);
		this.emojis = new Emojis(this);
		this.stickers = new Stickers(this);
		this.presences = new Presences(this);
		this.voiceStates = new VoiceStates(this);
		this.threads = new Threads(this);
		this.stageInstances = new StageInstances(this);
	}

	async bulkSet(keys:
		(
			readonly [
				/* type */
				NonGuildBased,
				/* data */
				any,
				/* source id */
				string
			] |
			readonly [
				/* type */
				GuildBased,
				/* data */
				any,
				/* source id */
				string,
				/* guild id */
				string
			]
		)[]
	) {
		const allData: [string, any][] = [];
		const relationshipsData: Record<string, string[]> = {};

		for (const [type, data, id, guildId] of keys) {
			switch (type) {
				case 'roles':
				case 'emojis':
				case 'threads':
				case 'members':
				case 'stickers':
				case 'channels':
				case 'presences':
				case 'voiceStates':
				case 'stageInstances': {
					const hashId = this[type].hashId(guildId!);
					if (!(hashId in relationshipsData)) { relationshipsData[hashId] = []; }
					relationshipsData[hashId].push(id);
					data.guild_id = guildId;
					allData.push([this[type].hashGuildId(id, guildId), this[type].parse(data, id, guildId!)]);
				}
					break;
				case 'users':
				case 'guilds': {
					const hashId = this[type].namespace;
					if (!(hashId in relationshipsData)) { relationshipsData[hashId] = []; }
					relationshipsData[hashId].push(id);
					allData.push([this[type].hashId(id), data]);
				}
					break;
				default:
					throw new Error('Invalid type ' + type);
			}
		}

		// console.log({
		// 	allData,
		// 	relationshipsData
		// });

		await this.adapter.set(
			allData
		);
		await this.adapter.bulkAddToRelationShip(
			relationshipsData
		);

		return allData;
	}

	async onPacket(_shard: Shard, event: any) {

		if (this.disabledEvents.includes(event.t)) {
			return;
		}

		switch (event.t as CachedEvents) {
			case 'READY': {
				const data = event.d as DiscordReady;
				await this.users.set(data.user.id, data.user);
				const bulkData: Parameters<Cache['bulkSet']>[0] = [];

				bulkData.push(...data.guilds.map(x =>
					['guilds', x, x.id] as const
				));

				bulkData.push(['users', data.user, data.user.id]);

				await this.bulkSet(
					bulkData
				);
			} break;
			case 'GUILD_CREATE':
			case 'GUILD_UPDATE':
				await this.guilds.set(event.d.id, event.d);
				break;
			case 'GUILD_DELETE':
				if (event.d.unavailable) {
					await this.guilds.set(event.d.id, event.d);
				} else {
					await this.guilds.remove(event.d.id);
				}
				break;
			case 'CHANNEL_CREATE':
			case 'CHANNEL_UPDATE':
				if (!event.d.guild_id) {
					return;
				}
				await this.channels.set(event.d.id, event.d.guild_id, event.d);
				break;
			case 'CHANNEL_DELETE':
				if (!event.d.guild_id) {
					return;
				}
				await this.channels.remove(event.d.id, event.d.guild_id);
				break;
			case 'GUILD_ROLE_CREATE':
			case 'GUILD_ROLE_UPDATE':
				await this.roles.set(event.d.role.id, event.d.guild_id, event.d.role);
				break;
			case 'GUILD_ROLE_DELETE':
				await this.roles.remove(event.d.role_id, event.d.guild_id);
				break;
			case 'GUILD_EMOJIS_UPDATE':
				await this.emojis.remove(await this.emojis.keys(event.d.guild_id), event.d.guild_id);
				await this.emojis.set((event.d.emojis as DiscordEmoji[]).map(x => [x.id!, x]), event.d.guild_id);
				break;
			case 'GUILD_STICKERS_UPDATE':
				await this.stickers.remove(await this.stickers.keys(event.d.guild_id), event.d.guild_id);
				await this.stickers.set((event.d.stickers as DiscordSticker[]).map(x => [x.id, x]), event.d.guild_id);
				break;
			case 'GUILD_MEMBER_ADD':
			case 'GUILD_MEMBER_UPDATE':
				await this.members.set(event.d.user.id, event.d.guild_id, event.d);
				break;
			case 'GUILD_MEMBER_REMOVE':
				await this.members.remove(event.d.user.id, event.d.guild_id);
				break;

			case 'MESSAGE_CREATE':
				if (event.d.member && event.d.author) {
					await this.members.set(event.d.author.id, event.d.guild_id, event.d.member);
				}
				break;

			case 'PRESENCE_UPDATE':
				// Should update member data?
				await this.presences.set(event.d.user.id, event.d.guild_id, event.d);
				break;

			case 'THREAD_CREATE':
			case 'THREAD_UPDATE':
				await this.threads.set(event.d.id, event.d.guild_id, event.d);
				break;

			case 'THREAD_DELETE':
				await this.threads.remove(event.d.id, event.d.guild_id);
				break;

			case 'USER_UPDATE':
				await this.users.set(event.d.id, event.d);
				break;

			case 'VOICE_STATE_UPDATE':
				if (!event.d.guild_id) {
					return;
				}

				if (event.d.guild_id && event.d.member && event.d.user_id) {
					await this.members.set(event.d.user_id, event.d.guild_id, event.d.member);
				}

				if (event.d.channel_id != null) {
					await this.voiceStates.set(event.d.user_id, event.d.guild_id, event.d);
				} else {
					await this.voiceStates.remove(event.d.user_id, event.d.guild_id);
				}
				break;
			case 'STAGE_INSTANCE_CREATE':
			case 'STAGE_INSTANCE_UPDATE':
				await this.stageInstances.set(event.d.id, event.d.guild_id, event.d);
				break;
			case 'STAGE_INSTANCE_DELETE':
				await this.stageInstances.remove(event.d.id, event.d.guild_id);
				break;
		}
	}
}
