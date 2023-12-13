import { Router, BiscuitREST } from '@biscuitland/rest';
import type { Adapter } from '../cache';
import { Cache, DefaultMemoryAdapter } from '../cache';
import { PotoLangsHandler } from '../langs/handler';
import { PotoCommandHandler } from '../commands/handler';
import { join } from 'node:path';
import { LogLevels, Logger } from '@biscuitland/common';
import type { DeepPartial } from '../structures/extra/types';
import { ComponentHandler } from '../Components/handler';

export class BaseClient {
	// gateway!: GatewayManager;
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
	components = new ComponentHandler(this.logger, this);

	private _applicationId?: string;
	private _botId?: string;

	protected static assertString(value: unknown, message?: string): asserts value is string {
		if (!(typeof value === 'string' && value !== '')) { throw new Error(message ?? 'Value is not a string'); }
	}

	protected static getBotIdFromToken(token: string): string {
		return Buffer.from(token.split('.')[0], 'base64').toString('ascii');
	}

	set botId(id: string) {
		this._botId = id;
	}

	get botId() {
		return this._botId ?? BaseClient.getBotIdFromToken(this.rest.options.token);
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

	setServices({ rest, cache }: { rest?: BiscuitREST; cache?: Adapter }) {
		if (rest) {
			this.rest = rest;
		}
		if (cache) {
			this.cache = new Cache(this.cache?.intents ?? 0, cache, this.cache?.disabledCache, this.rest);
		}
	}

	protected async execute(..._options: unknown[]) {
		this.debugger.active = (await this.getRC()).debug;
	}

	async start(options: Pick<DeepPartial<StartOptions>, 'langsDir' | 'commandsDir' | 'connection' | 'token' | 'componentsDir'> = {}) {
		await this.loadLangs(options.langsDir);
		await this.loadCommands(options.commandsDir);
		await this.loadComponents(options.componentsDir);

		const { token: tokenRC, } = await this.getRC();
		const token = options?.token ?? tokenRC;

		if (!this.rest) {
			BaseClient.assertString(token, 'token is not a string');
			this.rest = new BiscuitREST({
				token
			});
		}

		if (!this.cache) {
			this.cache = new Cache(0, new DefaultMemoryAdapter(), [], this.rest);
		} else {
			this.cache.__setRest(this.rest);
		}
	}

	protected async onPacket(..._packet: unknown[]) {
		throw new Error('Function not implemented');
	}

	async uploadCommands(applicationId?: string) {
		applicationId ??= await this.getRC().then(x => x.applicationId ?? this.applicationId);
		BaseClient.assertString(applicationId, 'applicationId is not a string');
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

	async loadComponents(dir?: string) {
		dir ??= await this.getRC().then(x => x.components);
		if (dir) {
			await this.components.load(dir);
			this.logger.info('PotoComponentHandler loaded');
		}
	}

	async loadLangs(dir?: string) {
		dir ??= await this.getRC().then(x => x.langs);
		if (dir) {
			await this.langs.load(dir);
			this.logger.info('PotoLangsHandler loaded');
		}
	}

	async getRC() {
		const { variables, locations, debug } = await import(join(process.cwd(), '.potorc.json')) as RC;
		const env = await import(join(process.cwd(), variables)).then(x => x.default) as Required<Variables>;

		return {
			debug: !!debug,

			...env,

			langs: locations.langs ? join(process.cwd(), locations.langs) : undefined,
			templates: locations.templates ? join(process.cwd(), locations.base, locations.templates) : undefined,
			events: locations.events ? join(process.cwd(), locations.output, locations.events) : undefined,
			components: locations.components ? join(process.cwd(), locations.output, locations.components) : undefined,
			base: join(process.cwd(), locations.base),
			output: join(process.cwd(), locations.output),
			commands: join(process.cwd(), locations.output, locations.commands),
		};

	}
}

interface RC {
	debug?: boolean;
	variables: string;
	locations: {
		base: string;
		output: string;
		commands: string;
		langs?: string;
		templates?: string;
		events?: string;
		components?: string;
	};
}

export interface Variables {
	token: string;
	intents?: number;
	applicationId: string;
	port?: number;
	publicKey: string;
}

export interface StartOptions {
	eventsDir: string;
	langsDir: string;
	commandsDir: string;
	componentsDir: string;
	connection: { intents: number };
	httpConnection: { publicKey: string; port: number };
	token: string;
}

export const DefaultVars = {
	port: 8080,
	intents: 0,
};
