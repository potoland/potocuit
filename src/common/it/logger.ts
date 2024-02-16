import { bgBrightWhite, black, bold, brightBlack, cyan, gray, italic, red, yellow } from './colors';
import { MergeOptions } from './utils';
export enum LogLevels {
	Debug = 0,
	Info = 1,
	Warn = 2,
	Error = 3,
	Fatal = 4,
}

export type LoggerOptions = {
	logLevel?: LogLevels;
	name?: string;
	active?: boolean;
};

export type CustomCallback = (self: Logger, level: LogLevels, args: unknown[]) => unknown[];

export class Logger {
	readonly options: Required<LoggerOptions>;
	private static __callback?: CustomCallback;

	static customize(cb: CustomCallback) {
		Logger.__callback = cb;
	}

	constructor(options: LoggerOptions) {
		this.options = MergeOptions(Logger.DEFAULT_OPTIONS, options);
	}

	set level(level: LogLevels) {
		this.options.logLevel = level;
	}

	get level(): LogLevels {
		return this.options.logLevel;
	}

	set active(active: boolean) {
		this.options.active = active;
	}

	get active(): boolean {
		return this.options.active;
	}

	set name(name: string) {
		this.options.name = name;
	}

	get name(): string {
		return this.options.name;
	}

	rawLog(level: LogLevels, ...args: unknown[]) {
		if (!this.active) return;
		if (level < this.level) return;

		let log;

		if (!Logger.__callback) {
			const color = Logger.colorFunctions.get(level) ?? Logger.noColor;
			const memoryData = process.memoryUsage();
			const date = new Date();
			log = [
				brightBlack(formatMemoryUsage(memoryData.rss)),
				bgBrightWhite(black(`[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]`)),
				color(Logger.prefixes.get(level) ?? 'DEBUG'),
				this.name ? `${this.name} >` : '>',
				...args,
			];
		} else {
			log = Logger.__callback(this, level, args);
		}

		return console.log(...log);
	}

	debug(...args: any[]) {
		this.rawLog(LogLevels.Debug, ...args);
	}

	info(...args: any[]) {
		this.rawLog(LogLevels.Info, ...args);
	}

	warn(...args: any[]) {
		this.rawLog(LogLevels.Warn, ...args);
	}

	error(...args: any[]) {
		this.rawLog(LogLevels.Error, ...args);
	}

	fatal(...args: any[]) {
		this.rawLog(LogLevels.Fatal, ...args);
	}

	static DEFAULT_OPTIONS: Required<LoggerOptions> = {
		logLevel: LogLevels.Debug,
		name: 'PARAGON',
		active: true,
	};

	static noColor(msg: string) {
		return msg;
	}

	static colorFunctions = new Map<LogLevels, (str: string) => string>([
		[LogLevels.Debug, gray],
		[LogLevels.Info, cyan],
		[LogLevels.Warn, yellow],
		[LogLevels.Error, red],
		[LogLevels.Fatal, (str: string) => red(bold(italic(str)))],
	]);

	static prefixes = new Map<LogLevels, string>([
		[LogLevels.Debug, 'DEBUG'],
		[LogLevels.Info, 'INFO'],
		[LogLevels.Warn, 'WARN'],
		[LogLevels.Error, 'ERROR'],
		[LogLevels.Fatal, 'FATAL'],
	]);
}

function formatMemoryUsage(data: number) {
	return `[RAM Usage ${Math.round((data / 1024 / 1024) * 100) / 100} MB]`;
}
