import type { WriteStream } from 'fs';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { Logger as BiscuitLogger } from '@biscuitland/common';

export class Logger {
	files: Record<string, WriteStream> = {};
	name = 'base';
	private logger = new BiscuitLogger({
		active: true,
		logLevel: 0,
		name: this.name
	});

	constructor(_options: any) {
		//
	}

	info(...str: any[]) {
		return this.write('info', ...str);
	}

	warn(...str: any[]) {
		return this.write('warn', ...str);
	}

	debug(...str: any[]) {
		return this.write('debug', ...str);
	}

	fatal(...str: any[]) {
		return this.write('fatal', ...str);
	}

	error(...str: any[]) {
		return this.write('error', ...str);
	}

	private write(...str: any[]) {
		this.logger.options.name = `[${this.name}]`;
		const messages = str.map(x => {
			if (x === undefined) { return 'undefined'; }
			if (x === null) { return 'null'; }
			return x.toString();
		}) as string[];

		const matches = messages[1].match(/#\d+/gi);
		if (!matches) { return this.logger[messages[0] as 'info' | 'warn' | 'debug' | 'fatal' | 'error'](...str.slice(1)); }
		const match = matches[0].slice(1) + '.txt';

		const file = join(process.cwd(), 'logs', this.name, match);

		this.files[match] ??= createWriteStream(file);

		this.files[match].write(messages.join(' ') + '\n');

		this.logger[messages[0] as 'info' | 'warn' | 'debug' | 'fatal' | 'error'](...str.slice(1));
	}
}
