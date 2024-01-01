import { join } from 'node:path';
import { REST, Router } from '../api';
import type { Adapter } from '../cache';
import { Cache, DefaultMemoryAdapter } from '../cache';
import { MiddlewareContext } from '../commands/applications/shared';
import { PotoCommandHandler } from '../commands/handler';
import type { LocaleString, MakeRequired } from '../common';
import { LogLevels, Logger, filterSplit } from '../common';
import type { DeepPartial, IntentStrings, OmitInsert } from '../common/types/util';
import { ComponentHandler } from '../components/handler';
import { PotoLangsHandler } from '../langs/handler';
import { ChatInputCommandInteraction, MessageCommandInteraction, UserCommandInteraction } from '../structures';
import type { PotoClient } from './client';
import type { PotoHttpClient } from './httpclient';
import type { WorkerClient } from './workerclient';

export class BaseClient {
	/** @internal */
	handleGuilds = new Set<string>();
	rest!: REST;
	cache!: Cache;

	debugger = new Logger({
		name: '[Debug]',
		active: false,
		logLevel: LogLevels.Debug,
	});

	logger = new Logger({
		name: '@potoland/core',
		active: true,
		logLevel: LogLevels.Info,
	});

	commands = new PotoCommandHandler(this.logger);
	langs = new PotoLangsHandler(this.logger);
	components = new ComponentHandler(this.logger, this);

	private _applicationId?: string;
	private _botId?: string;

	protected static assertString(value: unknown, message?: string): asserts value is string {
		if (!(typeof value === 'string' && value !== '')) {
			throw new Error(message ?? 'Value is not a string');
		}
	}

	protected static getBotIdFromToken(token: string): string {
		return Buffer.from(token.split('.')[0], 'base64').toString('ascii');
	}

	options: BaseClientOptions | undefined;

	constructor(options?: BaseClientOptions) {
		this.options = options;
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

	setServices({
		rest,
		cache,
		defaultLang,
	}: {
		rest?: REST;
		cache?: { adapter: Adapter; disabledCache?: Cache['disabledCache'] };
		defaultLang?: LocaleString;
	}) {
		if (rest) {
			this.rest = rest;
		}
		if (cache) {
			this.cache = new Cache(
				this.cache?.intents ?? 0,
				cache.adapter,
				cache.disabledCache ?? this.cache?.disabledCache,
				this,
			);
		}
		this.langs.defaultLang = defaultLang;
	}

	protected async execute(..._options: unknown[]) {
		this.debugger.active = (await this.getRC()).debug;
	}

	async start(
		options: Pick<DeepPartial<StartOptions>, 'langsDir' | 'commandsDir' | 'connection' | 'token' | 'componentsDir'> = {
			token: undefined,
			langsDir: undefined,
			commandsDir: undefined,
			connection: undefined,
			componentsDir: undefined,
		},
	) {
		await this.loadLangs(options.langsDir);
		await this.loadCommands(options.commandsDir);
		await this.loadComponents(options.componentsDir);

		const { token: tokenRC } = await this.getRC();
		const token = options?.token ?? tokenRC;

		if (!this.rest) {
			BaseClient.assertString(token, 'token is not a string');
			this.rest = new REST({
				token,
				debug: false//(await this.getRC()).debug,
			});
		}

		if (!this.cache) {
			this.cache = new Cache(0, new DefaultMemoryAdapter(), [], this);
		} else {
			this.cache.__setClient(this);
		}
	}

	protected async onPacket(..._packet: unknown[]) {
		throw new Error('Function not implemented');
	}

	async uploadCommands(applicationId?: string) {
		applicationId ??= await this.getRC().then((x) => x.applicationId ?? this.applicationId);
		BaseClient.assertString(applicationId, 'applicationId is not a string');

		const commands = this.commands.values.map((x) => x.toJSON());
		const filter = filterSplit(commands, (command) => !command.guild_id);

		await this.proxy.applications(applicationId).commands.put({
			body: filter.expect,
		});

		const guilds = new Set<string>();

		for (const command of filter.never) {
			for (const guild_id of command.guild_id!) {
				guilds.add(guild_id);
			}
		}

		for (const guild of guilds) {
			await this.proxy
				.applications(applicationId)
				.guilds(guild)
				.commands.put({
					body: filter.never.filter((x) => x.guild_id?.includes(guild)),
				});
		}
	}

	async loadCommands(dir?: string) {
		dir ??= await this.getRC().then((x) => x.commands);
		BaseClient.assertString(dir);
		await this.commands.load(dir, this);
		this.logger.info('PotoCommandHandler loaded');
	}

	async loadComponents(dir?: string) {
		dir ??= await this.getRC().then((x) => x.components);
		if (dir) {
			await this.components.load(dir);
			this.logger.info('PotoComponentHandler loaded');
		}
	}

	async loadLangs(dir?: string) {
		dir ??= await this.getRC().then((x) => x.langs);
		if (dir) {
			await this.langs.load(dir);
			this.logger.info('PotoLangsHandler loaded');
		}
	}

	async getRC<
		T extends InternalRuntimeConfigHTTP | InternalRuntimeConfig = InternalRuntimeConfigHTTP | InternalRuntimeConfig,
	>() {
		const { locations, debug, ...env } = (await import(join(process.cwd(), 'poto.config.js')).then(
			(x) => x.default,
		)) as T;

		return {
			debug: !!debug,
			...env,
			langs: locations.langs ? join(process.cwd(), locations.langs) : undefined,
			templates: locations.templates ? join(process.cwd(), locations.base, locations.templates) : undefined,
			events:
				'events' in locations && locations.events ? join(process.cwd(), locations.output, locations.events) : undefined,
			components: locations.components ? join(process.cwd(), locations.output, locations.components) : undefined,
			base: join(process.cwd(), locations.base),
			output: join(process.cwd(), locations.output),
			commands: join(process.cwd(), locations.output, locations.commands),
		};
	}
}

export interface BaseClientOptions {
	context?: (
		interaction:
			| ChatInputCommandInteraction<boolean>
			| UserCommandInteraction<boolean>
			| MessageCommandInteraction<boolean>,
	) => {};
	globalMiddlewares?: readonly MiddlewareContext[];
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

interface RC extends Variables {
	debug?: boolean;
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
	applicationId?: string;
	port?: number;
	publicKey?: string;
}

export type InternalRuntimeConfigHTTP = Omit<
	MakeRequired<RC, 'publicKey' | 'port' | 'applicationId'>,
	'intents' | 'locations'
> & { locations: Omit<RC['locations'], 'events'> };
export type RuntimeConfigHTTP = Omit<MakeRequired<RC, 'publicKey' | 'applicationId'>, 'intents' | 'locations'> & {
	locations: Omit<RC['locations'], 'events'>;
};

export type InternalRuntimeConfig = Omit<MakeRequired<RC, 'intents'>, 'publicKey' | 'port'>;
export type RuntimeConfig = OmitInsert<InternalRuntimeConfig, 'intents', { intents?: IntentStrings | number }>;

export interface IClients {
	base: BaseClient;
	http: PotoHttpClient;
	client: PotoClient;
	worker: WorkerClient;
}
