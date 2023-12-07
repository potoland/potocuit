import { Router, type BiscuitREST } from '@biscuitland/rest';
import type { GatewayManager } from '@biscuitland/ws';
import type { Cache } from '../cache';
import { PotoLangsHandler } from '../langs/handler';
import { PotoCommandHandler } from '../commands/handler';
import { join } from 'node:path';
import { LogLevels, Logger } from '@biscuitland/common';
import type { DeepPartial } from '../structures/extra/types';
import { ComponentHandler } from '../Components/handler';

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
	});

	commands = new PotoCommandHandler(this.logger, this);
	langs = new PotoLangsHandler(this.logger);
	/** @internal */
	readonly __components__ = new ComponentHandler(this);

	private _applicationId?: string;
	private _botId?: string;

	protected static assertString(value: unknown): asserts value is string {
		if (!(typeof value === 'string' && value !== '')) { throw new Error('Value is not a string'); }
	}

	protected static getBotIdFromToken(token: string): string {
		return Buffer.from(token.split('.')[0], 'base64').toString('ascii');
	}

	set botId(id: string) {
		this._botId = id;
	}

	get botId() {
		return this._botId ?? BaseClient.getBotIdFromToken(this.gateway.options.token);
	}

	set applicationId(id: string) {
		this._applicationId = id;
	}

	get applicationId() {
		return this._applicationId ?? this.botId;
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
	}

	async start(options: Pick<DeepPartial<StartOptions>, 'langsDir' | 'commandsDir'> = {}) {
		await this.loadLangs(options.langsDir);
		await this.loadCommands(options.commandsDir);
	}

	protected async onPacket(..._packet: unknown[]) {
		throw new Error('Function not implemented');
	}

	async uploadCommands(applicationId?: string) {
		applicationId ??= await this.getRC().then(x => x.applicationId ?? this.applicationId);
		BaseClient.assertString(applicationId);
		return this.proxy.applications(applicationId).commands.put({
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

	getRC() {
		return import(join(process.cwd(), '.potorc.json')).then((x: RC) => {
			const { application, locations } = x;
			return {
				debug: !!x.debug,

				token: application.token,
				intents: !Number.isNaN(application.intents) ? Number(application.intents) : 0,

				applicationId: application.applicationId,

				port: !Number.isNaN(application.port) ? Number(application.port) : 8080,
				publicKey: application.publicKey,

				langs: locations.langs ? join(process.cwd(), locations.langs) : undefined,
				events: locations.events ? join(process.cwd(), locations.output, locations.events) : undefined,
				templates: locations.templates ? join(process.cwd(), locations.templates) : undefined,
				base: join(process.cwd(), locations.base),
				output: join(process.cwd(), locations.output),
				commands: join(process.cwd(), locations.output, locations.commands),
			};
		});
	}
}

interface RC {
	debug?: boolean;
	application: {
		token: string;
		intents?: number;
		applicationId?: string;
		port?: number;
		publicKey?: string;
	};
	locations: {
		base: string;
		output: string;
		commands: string;
		langs?: string;
		templates?: string;
		events?: string;
	};
}

export interface StartOptions {
	eventsDir: string;
	langsDir: string;
	commandsDir: string;
	connection: { token: string; intents: number };
	httpConnection: { publicKey: string; port: number };
}
