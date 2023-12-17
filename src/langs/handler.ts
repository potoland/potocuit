import { Locale, type LocaleString } from '@biscuitland/common';
import type { __LangType } from '../__generated';
import { PotoHandler } from '../utils';

const values = Object.values(Locale);

export class PotoLangsHandler extends PotoHandler {
	record: Partial<Record<LocaleString, any>> = {};
	protected filter = (path: string) => path.endsWith('.json');

	getKey(lang: string, message: string) {
		let value: any = this.record[lang as LocaleString];

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

	get<K extends keyof __LangType>(lang: LocaleString, message: K, metadata: __LangType[K]) {
		try {
			const value = this.getKey(lang, message);
			if (!value) { throw new Error('Invalid key'); }
			return this.parse(value, metadata);
		} catch {
			throw new Error('Invalid key');
		}
	}

	async load(dir: string) {
		const files = await this.loadFilesK<Record<string, any>>(await this.getFiles(dir));
		for (const i of files) {
			if (!values.includes(i.name.slice(0, -5) as any)) {
				this.logger.fatal(`Invalid lang [${i.name.slice(0, -5)}]`);
				continue;
			}
			this.record[i.name as LocaleString] = i.file;
		}
	}
}
