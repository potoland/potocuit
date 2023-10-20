import type { GatewayDispatchPayload } from '@biscuitland/common';
import { ApplicationCommandOptionType } from '@biscuitland/common';
import { BiscuitREST, Router } from '@biscuitland/rest';
import { GatewayManager } from '@biscuitland/ws';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { Cache, DefaultMemoryAdapter } from '../cache';
import type { SubCommand } from '../commands';
import { Command } from '../commands';
import { BaseInteraction } from '../structures/Interaction';
import { throwError } from '..';

export class PotoClient {
	gateway!: GatewayManager;
	rest!: BiscuitREST;
	cache!: Cache;

	get proxy() {
		return new Router(this.rest).createProxy();
	}

	setServices({ gateway, rest, cache }: { rest?: BiscuitREST; gateway?: GatewayManager; cache?: Cache }) {
		if (gateway) {
			const onPacket = this.onPacket.bind(this);
			const oldFn = gateway.options.handlePayload;
			gateway.options.handlePayload = async (shardId, packet) => {
				await onPacket(shardId, packet);
				return oldFn(shardId, packet);
			};
			this.gateway = gateway;
		}
		if (rest) {
			this.rest = rest;
		}
		if (cache) {
			this.cache = cache;
		}
	}

	async execute(token?: string, intents = 0) {
		this.rest ??= (!token && throwError('Token expected')) || new BiscuitREST({
			token: token!
		});

		this.gateway ??= (!token && throwError('Token expected')) || new GatewayManager({
			token: token!,
			info: await this.proxy.gateway.bot.get(),
			intents,
			handlePayload: (shardId, packet) => {
				return this.onPacket(shardId, packet);
			},
		});

		this.cache ??= new Cache(this.gateway.options.intents, this.rest, new DefaultMemoryAdapter());

		await this.gateway.spawnShards();
	}

	protected async onPacket(shardId: number, packet: GatewayDispatchPayload) {
		await this.cache.onPacket(packet);
		switch (packet.t) {
			case 'INTERACTION_CREATE': {
				const interaction = BaseInteraction.from(this.rest, this.cache, packet.d);
				console.log(interaction);
			} break;
		}
		if (packet.t === 'READY') { console.log(`${shardId}`, packet.d.user.username); }
		// else console.log(`${shardId}`, packet.d, packet.t);
	}

	protected async getFiles(dir: string) {
		const files: string[] = [];

		for (const i of await readdir(dir, { withFileTypes: true })) {
			if (i.isDirectory()) { files.push(...await this.getFiles(join(dir, i.name))); } else { files.push(join(dir, i.name)); }
		}

		return files;
	}

	async loadCommands(commandsDir: string) {
		const commandsPaths = await this.getFiles(commandsDir);
		const commands = await Promise.all(commandsPaths.map(x => import(x).then(d => d.default)));

		const result: Record<string, any> = {};

		for (const command of commands) {
			if (!(command instanceof Command)) { continue; }
			// const groups = command.groups
			// 	? Object.entries(command.groups).map(x => x[0]).join(', ')
			// 	: undefined
			// console.log(`Command ${command.name} ${groups ? 'groups: ' + groups : ''}`);

			// console.log('command', command)
			if (command.groups) {
				const groups = Object.entries(command.groups)
					.map(x => ({
						name: x[0],
						name_localizations: x[1].name ? Object.fromEntries(x[1].name) : {},
						description: x[1].defaultDescription,
						description_localizations: x[1].description ? Object.fromEntries(x[1].description) : {},
						type: ApplicationCommandOptionType.SubcommandGroup,
						options: (command.options as SubCommand[]).filter(op => op.group === x[0])
					}));

				console.log('groups', groups, command.options);
				command.options ??= [];

				// @ts-expect-error
				command.options = command.options!.filter(x => !x.group);

				// @ts-expect-error
				command.options!.push(...groups);
			}

			result[command.name] = command;

			// console.log(obj, 'obj')
		}

		return result;
	}
}
