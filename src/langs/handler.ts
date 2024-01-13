import { BaseHandler, Locale, type LocaleString } from '../common';
import { LangRouter } from './router';

const values = Object.values(Locale);

export class LangsHandler extends BaseHandler {
	values: Partial<Record<LocaleString, any>> = {};
	protected filter = (path: string) => path.endsWith('.js');
	defaultLang?: LocaleString;

	getKey(lang: string, message: string) {
		let value: any = this.values[lang as LocaleString];

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

	get(userLocale: LocaleString) {
		return LangRouter(this.defaultLang ?? userLocale, this.values)();
	}

	async load(dir: string) {
		const files = await this.loadFilesK<Record<string, any>>(await this.getFiles(dir));
		for (const i of files) {
			if (!values.includes(i.name.slice(0, -3) as any)) {
				this.logger.fatal(`Invalid lang [${i.name.slice(0, -3)}]`);
				continue;
			}
			this.values[i.name.slice(0, -3) as LocaleString] = i.file;
		}
	}
}
