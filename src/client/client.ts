import type { GatewayPresenceUpdateData, LocaleString } from '@biscuitland/common';
import { type GatewayDispatchPayload } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Adapter, Cache } from '../cache';
import { PotoEventHandler } from '../events';
import { DeepPartial } from '../types';
import { ShardManager } from '../websocket';
import type { BaseClientOptions, InternalRuntimeConfig, StartOptions } from './base';
import { BaseClient } from './base';
import { onInteraction } from './oninteraction';

export class PotoClient extends BaseClient {
	gateway!: ShardManager;
	events = new PotoEventHandler(this.logger);
	declare options: PotoClientOptions | undefined;

	constructor(options?: PotoClientOptions) {
		super(options);
	}

	setServices({
		gateway,
		rest,
		cache,
		defaultLang,
	}: {
		rest?: BiscuitREST;
		gateway?: ShardManager;
		cache?: { adapter: Adapter; disabledCache?: Cache['disabledCache'] };
		defaultLang?: LocaleString;
	}) {
		super.setServices({ rest, cache, defaultLang });
		if (gateway) {
			const onPacket = this.onPacket.bind(this);
			const oldFn = gateway.options.handlePayload;
			gateway.options.handlePayload = async (shardId, packet) => {
				await onPacket(shardId, packet);
				return oldFn(shardId, packet);
			};
			this.gateway = gateway;
		}
	}

	async loadEvents(dir?: string) {
		dir ??= await this.getRC().then((x) => x.events);
		if (dir) {
			await this.events.load(dir);
			this.logger.info('PotoEventHandler loaded');
		}
	}

	protected async execute(options: { token?: string; intents?: number } = {}) {
		await super.execute(options);
		await this.gateway.spawnShards();
	}

	async start(options: Omit<DeepPartial<StartOptions>, 'httpConnection'> = {}, execute = true) {
		await super.start(options);
		await this.loadEvents(options.eventsDir);

		const { token: tokenRC, intents: intentsRC, debug: debugRC } = await this.getRC<InternalRuntimeConfig>();
		const token = options?.token ?? tokenRC;
		const intents = options?.connection?.intents ?? intentsRC;

		if (!this.gateway) {
			BaseClient.assertString(token, 'token is not a string');
			this.gateway = new ShardManager({
				token,
				info: await this.proxy.gateway.bot.get(),
				intents,
				handlePayload: (shardId, packet) => {
					return this.onPacket(shardId, packet);
				},
				presence: this.options?.presence,
				debug: debugRC,
			});
		}

		this.cache.intents = this.gateway.options.intents;

		if (execute) {
			await this.execute(options.connection);
		} else {
			await super.execute(options);
		}
	}

	protected async onPacket(shardId: number, packet: GatewayDispatchPayload) {
		await this.cache.onPacket(packet);
		switch (packet.t) {
			case 'READY':
				for (const { id } of packet.d.guilds) {
					this.handleGuilds.add(id);
				}
				this.botId = packet.d.user.id;
				this.applicationId = packet.d.application.id;
				this.debugger.debug(`#${shardId}[ ${packet.d.user.username}](${this.botId}) is online...`);
				break;
			case 'INTERACTION_CREATE': {
				await onInteraction(shardId, packet.d, this);
				break;
			}
			case 'GUILD_CREATE': {
				if (this.handleGuilds.has(packet.d.id)) {
					this.handleGuilds.delete(packet.d.id);
					return;
				}
			}
		}

		await this.events.execute(packet.t, packet, this, shardId);
	}
}

export interface PotoClientOptions extends BaseClientOptions {
	presence?: (shardId: number) => GatewayPresenceUpdateData;
}
