import type { BiscuitREST } from '@biscuitland/rest';
import { Router } from '@biscuitland/rest';
import type { GatewayManager } from '@biscuitland/ws';
import type { Cache } from '../cache';
import { PotoLangsHandler } from '../langs/handler';
import { PotoCommandHandler } from '../commands/handler';
import { join } from 'node:path';
import { LogLevels, Logger } from '@biscuitland/common';

export class BaseClient {
	gateway!: GatewayManager;
	rest!: BiscuitREST;
	cache!: Cache;
	debugger = new Logger({
		name: '[Debug]',
		active: false,
		logLevel: LogLevels.Debug
	});

	logger = new Logger({
		name: '@potoland/core',
		active: true,
		logLevel: LogLevels.Info,
	});// arreglen biscuit // urgente

	commands = new PotoCommandHandler();
	langs = new PotoLangsHandler();

	protected static assertString(value: unknown): asserts value is string {
		if (typeof value !== 'string' && value) { throw new Error('Value is not a string'); }
	}

	get proxy() {
		return new Router(this.rest).createProxy();
	}

	setServices({ rest, cache }: { rest?: BiscuitREST; cache?: Cache }) {
		if (rest) {
			this.rest = rest;
		}
		if (cache) {
			this.cache = cache;
		}
	}

	async execute(..._options: unknown[]) {
		this.debugger.active = (await this.getRC()).debug;
		// throw new Error('Function not implemented');
	}

	protected async onPacket(..._packet: unknown[]) {
		throw new Error('Function not implemented');
	}

	async uploadCommands(applicationId?: string) {
		applicationId ??= await this.getRC().then(x => x.applicationId);
		BaseClient.assertString(applicationId);
		return await this.proxy.applications(applicationId).commands.put({
			body: Object.values(this.commands.commands.map(x => x.toJSON()))
		});
	}

	async loadCommands(dir?: string) {
		dir ??= await this.getRC().then(x => x.commands);
		BaseClient.assertString(dir);
		await this.commands.load(dir, this);
		this.logger.info('PotoCommandHandler loaded');
	}

	async loadLangs(dir?: string) {
		dir ??= await this.getRC().then(x => x.langs);
		BaseClient.assertString(dir);
		await this.langs.load(dir);
		this.logger.info('PotoLangsHandler loaded');
	}

	protected getRC() {
		return import(join(process.cwd(), '.potorc.json')).catch(() => null).then((x: Record<'application' | 'locations' | 'debug', Record<string, any>>) => {
			const { debug, application, locations } = x;
			return {
				debug: !!debug,

				token: typeof application.token === 'string' ? application.token : undefined,
				intents: !Number.isNaN(application.intents) ? Number(application.intents) : 0,

				applicationId: typeof application.applicationId === 'string' ? application.applicationId : undefined,

				port: !Number.isNaN(application.port) ? Number(application.port) : 4000,
				publicKey: typeof application.publicKey === 'string' ? application.publicKey : undefined,

				base: join(process.cwd(), locations.base),
				output: join(process.cwd(), locations.output),
				langs: typeof locations.langs === 'string' ? join(process.cwd(), locations.langs) : undefined,
				events: typeof locations.events === 'string' ? join(process.cwd(), locations.output, locations.events) : undefined,
				commands: typeof locations.commands === 'string' ? join(process.cwd(), locations.output, locations.commands) : undefined,
			};
		});
	}
}
