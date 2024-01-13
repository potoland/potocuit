import { BaseHandler } from '../common';
import { LangRouter } from './router';

export class LangsHandler extends BaseHandler {
	values: Partial<Record<string, any>> = {};
	protected filter = (path: string) => path.endsWith('.js');
	defaultLang?: string;

	getKey(lang: string, message: string) {
		let value: any = this.values[lang as string];

		for (const i of message.split('.')) {
			value = value[i];
		}

		if (typeof value !== 'string') {
			return undefined;
		}

		return value;
	}

	parse(str: string, metadata: Record<string, any>) {
		const regex = /{{(.*?)}}/g;
		return str.replace(regex, match => metadata[match.slice(2, -2)] ?? match);
	}

	get(userLocale: string) {
		return LangRouter(this.defaultLang ?? userLocale, this.values)();
	}

	async load(dir: string) {
		const files = await this.loadFilesK<Record<string, any>>(await this.getFiles(dir));
		for (const i of files) {
			this.values[i.name.slice(0, -3) as string] = i.file;
		}
	}
}
