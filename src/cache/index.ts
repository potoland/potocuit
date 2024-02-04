import type {
	APIEmoji,
	APISticker,
	APIThreadChannel,
	GatewayDispatchPayload,
	GatewayReadyDispatchData,
} from '../common';

import type { Adapter } from './adapters';

import { Guilds } from './resources/guilds';
import { Users } from './resources/users';

import { Channels } from './resources/channels';
import { Emojis } from './resources/emojis';
import { Members } from './resources/members';
import { Presences } from './resources/presence';
import { Roles } from './resources/roles';
import { StageInstances } from './resources/stage-instances';
import { Stickers } from './resources/stickers';
import { Threads } from './resources/threads';
import { VoiceStates } from './resources/voice-states';

import type { BaseClient } from '../client/base';
import { ChannelType, GatewayIntentBits } from '../common';

// GuildBased
export type GuildBased = 'members';

// ClientGuildBased
export type GuildRelated =
	| 'emojis'
	| 'roles'
	| 'threads'
	| 'channels'
	| 'stickers'
	| 'presences'
	| 'voiceStates'
	| 'stageInstances';

// ClientBased
export type NonGuildBased = 'users' | 'guilds';

type ReturnManagers = {
	[K in NonGuildBased | GuildBased | GuildRelated]: NonNullable<Awaited<ReturnType<NonNullable<Cache[K]>['get']>>>;
};

export * from './adapters/index';

export type CachedEvents =
	| 'READY'
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
	// non-guild based
	users?: Users;
	guilds?: Guilds;

	// guild based
	members?: Members;

	// guild related
	roles?: Roles;
	emojis?: Emojis;
	threads?: Threads;
	channels?: Channels;
	stickers?: Stickers;
	presences?: Presences;
	voiceStates?: VoiceStates;
	stageInstances?: StageInstances;

	constructor(
		public intents: number,
		public adapter: Adapter,
		readonly disabledCache: (NonGuildBased | GuildBased | GuildRelated)[] = [],
		client?: BaseClient,
	) {
		// non-guild based
		if (!this.disabledCache.includes('users')) {
			this.users = new Users(this, client);
		}
		if (!this.disabledCache.includes('guilds')) {
			this.guilds = new Guilds(this, client);
		}

		// guild related
		if (!this.disabledCache.includes('members')) {
			this.members = new Members(this, client);
		}

		// guild based
		if (!this.disabledCache.includes('roles')) {
			this.roles = new Roles(this, client);
		}
		if (!this.disabledCache.includes('channels')) {
			this.channels = new Channels(this, client);
		}
		if (!this.disabledCache.includes('emojis')) {
			this.emojis = new Emojis(this, client);
		}
		if (!this.disabledCache.includes('stickers')) {
			this.stickers = new Stickers(this, client);
		}
		if (!this.disabledCache.includes('presences')) {
			this.presences = new Presences(this, client);
		}
		if (!this.disabledCache.includes('voiceStates')) {
			this.voiceStates = new VoiceStates(this, client);
		}
		if (!this.disabledCache.includes('threads')) {
			this.threads = new Threads(this, client);
		}
		if (!this.disabledCache.includes('stageInstances')) {
			this.stageInstances = new StageInstances(this, client);
		}
	}

	/** @internal */
	__setClient(client: BaseClient) {
		this.users?.__setClient(client);
		this.guilds?.__setClient(client);

		this.members?.__setClient(client);

		this.roles?.__setClient(client);
		this.channels?.__setClient(client);
		this.emojis?.__setClient(client);
		this.stickers?.__setClient(client);
		this.presences?.__setClient(client);
		this.voiceStates?.__setClient(client);
		this.threads?.__setClient(client);
		this.stageInstances?.__setClient(client);
	}

	// internal use ./structures
	hasIntent(intent: keyof typeof GatewayIntentBits) {
		return (this.intents & GatewayIntentBits[intent]) === GatewayIntentBits[intent];
	}

	get hasGuildsIntent() {
		return this.hasIntent('Guilds');
	}

	get hasRolesIntent() {
		return this.hasGuildsIntent;
	}

	get hasChannelsIntent() {
		return this.hasGuildsIntent;
	}

	get hasGuildMembersIntent() {
		return this.hasIntent('GuildMembers');
	}

	get hasEmojisAndStickersIntent() {
		return this.hasIntent('GuildEmojisAndStickers');
	}

	get hasVoiceStatesIntent() {
		return this.hasIntent('GuildVoiceStates');
	}

	get hasPrenseceUpdates() {
		return this.hasIntent('GuildPresences');
	}

	get hasDirectMessages() {
		return this.hasIntent('DirectMessages');
	}

	async bulkGet(
		keys: (
			| readonly [
				/* type */
				NonGuildBased | GuildRelated,
				/* source id */
				string,
			]
			| readonly [
				/* type */
				GuildBased,
				/* source id */
				string,
				/* guild id */
				string,
			]
		)[],
	) {
		const allData: Partial<Record<NonGuildBased | GuildBased | GuildRelated, string[][]>> = {};
		for (const [type, id, guildId] of keys) {
			switch (type) {
				case 'members':
					{
						if (!allData[type]) {
							allData[type] = [];
						}
						allData[type]!.push([id, guildId]);
					}
					break;
				case 'roles':
				case 'threads':
				case 'stickers':
				case 'channels':
				case 'presences':
				case 'voiceStates':
				case 'stageInstances':
				case 'emojis':
				case 'users':
				case 'guilds':
					{
						if (!allData[type]) {
							allData[type] = [];
						}
						allData[type]!.push([id]);
					}
					break;
				default:
					throw new Error(`Invalid type ${type}`);
			}
		}

		const obj: Partial<{
			[K in keyof ReturnManagers]: ReturnManagers[K][];
		}> = {};

		for (const i in allData) {
			const key = i as NonGuildBased | GuildBased | GuildRelated;
			const values = allData[key]!;
			obj[key] = [];
			for (const value of values) {
				const g = await this[key]?.get(value[0], value[1]);
				if (!g) {
					continue;
				}
				obj[key]!.push(g as never);
			}
		}

		return obj;
	}

	async bulkPatch(
		keys: (
			| readonly [
				/* type */
				NonGuildBased,
				/* data */
				any,
				/* source id */
				string,
			]
			| readonly [
				/* type */
				GuildBased | GuildRelated,
				/* data */
				any,
				/* source id */
				string,
				/* guild id */
				string,
			]
		)[],
	) {
		const allData: [string, any][] = [];
		const relationshipsData: Record<string, string[]> = {};
		for (const [type, data, id, guildId] of keys) {
			switch (type) {
				case 'roles':
				case 'threads':
				case 'stickers':
				case 'channels':
				case 'presences':
				case 'voiceStates':
				case 'stageInstances':
				case 'emojis':
					{
						const hashId = this[type]?.hashId(guildId!);
						if (!hashId) {
							continue;
						}
						if (!(hashId in relationshipsData)) {
							relationshipsData[hashId] = [];
						}
						relationshipsData[hashId].push(id);
						data.guild_id = guildId;
						allData.push([this[type]!.hashId(id), this[type]!.parse(data, id, guildId!)]);
					}
					break;
				case 'members':
					{
						const hashId = this[type]?.hashId(guildId!);
						if (!hashId) {
							continue;
						}
						if (!(hashId in relationshipsData)) {
							relationshipsData[hashId] = [];
						}
						relationshipsData[hashId].push(id);
						data.guild_id = guildId;
						allData.push([this[type]!.hashGuildId(id, guildId), this[type]!.parse(data, id, guildId!)]);
					}
					break;
				case 'users':
				case 'guilds':
					{
						const hashId = this[type]?.namespace;
						if (!hashId) {
							continue;
						}
						if (!(hashId in relationshipsData)) {
							relationshipsData[hashId] = [];
						}
						relationshipsData[hashId].push(id);
						allData.push([this[type]!.hashId(id), data]);
					}
					break;
				default:
					throw new Error(`Invalid type ${type}`);
			}
		}

		await this.adapter.patch(false, allData);
		await this.adapter.bulkAddToRelationShip(relationshipsData);
	}

	async bulkSet(
		keys: (
			| readonly [
				/* type */
				NonGuildBased,
				/* data */
				any,
				/* source id */
				string,
			]
			| readonly [
				/* type */
				GuildBased | GuildRelated,
				/* data */
				any,
				/* source id */
				string,
				/* guild id */
				string,
			]
		)[],
	) {
		const allData: [string, any][] = [];
		const relationshipsData: Record<string, string[]> = {};
		for (const [type, data, id, guildId] of keys) {
			switch (type) {
				case 'roles':
				case 'threads':
				case 'stickers':
				case 'channels':
				case 'presences':
				case 'voiceStates':
				case 'stageInstances':
				case 'emojis':
					{
						const hashId = this[type]?.hashId(guildId!);
						if (!hashId) {
							continue;
						}
						if (!(hashId in relationshipsData)) {
							relationshipsData[hashId] = [];
						}
						relationshipsData[hashId].push(id);
						data.guild_id = guildId;
						allData.push([this[type]!.hashId(id), this[type]!.parse(data, id, guildId!)]);
					}
					break;
				case 'members':
					{
						const hashId = this[type]?.hashId(guildId!);
						if (!hashId) {
							continue;
						}
						if (!(hashId in relationshipsData)) {
							relationshipsData[hashId] = [];
						}
						relationshipsData[hashId].push(id);
						data.guild_id = guildId;
						allData.push([this[type]!.hashGuildId(id, guildId), this[type]!.parse(data, id, guildId!)]);
					}
					break;
				case 'users':
				case 'guilds':
					{
						const hashId = this[type]?.namespace;
						if (!hashId) {
							continue;
						}
						if (!(hashId in relationshipsData)) {
							relationshipsData[hashId] = [];
						}
						relationshipsData[hashId].push(id);
						allData.push([this[type]!.hashId(id), data]);
					}
					break;
				default:
					throw new Error(`Invalid type ${type}`);
			}
		}

		await this.adapter.set(allData);
		await this.adapter.bulkAddToRelationShip(relationshipsData);
	}

	async onPacket(event: GatewayDispatchPayload) {
		switch (event.t) {
			case 'READY':
				{
					const data = event.d as GatewayReadyDispatchData;
					await this.users?.set(data.user.id, data.user);
				}
				break;
			case 'GUILD_CREATE':
			case 'GUILD_UPDATE':
				await this.guilds?.patch(event.d.id, { unavailable: false, ...event.d });
				break;
			case 'GUILD_DELETE':
				if (event.d.unavailable) {
					await this.guilds?.patch(event.d.id, event.d);
				} else {
					await this.guilds?.remove(event.d.id);
				}
				break;
			case 'CHANNEL_CREATE':
			case 'CHANNEL_UPDATE':
				if ('guild_id' in event.d) {
					await this.channels?.set(event.d.id, event.d.guild_id!, event.d);
					break;
				}
				if (event.d.type === ChannelType.DM) {
					await this.channels?.set(event.d.recipients![0]?.id, '@me', event.d);
					break;
				}
				break;
			case 'CHANNEL_DELETE':
				await this.channels?.remove(event.d.id, 'guild_id' in event.d ? event.d.guild_id! : '@me');
				break;
			case 'GUILD_ROLE_CREATE':
			case 'GUILD_ROLE_UPDATE':
				await this.roles?.set(event.d.role.id, event.d.guild_id, event.d.role);
				break;
			case 'GUILD_ROLE_DELETE':
				await this.roles?.remove(event.d.role_id, event.d.guild_id);
				break;
			case 'GUILD_EMOJIS_UPDATE':
				await this.emojis?.remove(await this.emojis?.keys(event.d.guild_id), event.d.guild_id);
				await this.emojis?.set(
					(event.d.emojis as APIEmoji[]).map(x => [x.id!, x]),
					event.d.guild_id,
				);
				break;
			case 'GUILD_STICKERS_UPDATE':
				await this.stickers?.remove(await this.stickers?.keys(event.d.guild_id), event.d.guild_id);
				await this.stickers?.set(
					(event.d.stickers as APISticker[]).map(x => [x.id, x]),
					event.d.guild_id,
				);
				break;
			case 'GUILD_MEMBER_ADD':
			case 'GUILD_MEMBER_UPDATE':
				if (event.d.user) await this.members?.set(event.d.user.id, event.d.guild_id, event.d);
				break;
			case 'GUILD_MEMBER_REMOVE':
				await this.members?.remove(event.d.user.id, event.d.guild_id);
				break;

			case 'PRESENCE_UPDATE':
				// Should update member data?
				await this.presences?.set(event.d.user.id, event.d.guild_id, event.d);
				break;

			case 'THREAD_CREATE':
			case 'THREAD_UPDATE':
				await this.threads?.set(event.d.id, (event.d as APIThreadChannel).guild_id!, event.d);
				break;

			case 'THREAD_DELETE':
				await this.threads?.remove(event.d.id, (event.d as APIThreadChannel).guild_id!);
				break;

			case 'USER_UPDATE':
				await this.users?.set(event.d.id, event.d);
				break;

			case 'VOICE_STATE_UPDATE':
				if (!event.d.guild_id) {
					return;
				}

				if (event.d.channel_id != null) {
					await this.voiceStates?.set(event.d.user_id, event.d.guild_id, event.d);
				} else {
					await this.voiceStates?.remove(event.d.user_id, event.d.guild_id);
				}
				break;
			case 'STAGE_INSTANCE_CREATE':
			case 'STAGE_INSTANCE_UPDATE':
				await this.stageInstances?.set(event.d.id, event.d.guild_id, event.d);
				break;
			case 'STAGE_INSTANCE_DELETE':
				await this.stageInstances?.remove(event.d.id, event.d.guild_id);
				break;
		}
	}
}
