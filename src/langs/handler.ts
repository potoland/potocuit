import { Locale, type LocaleString } from '@biscuitland/common';
import { PotoHandler } from '../commands/handler';
import type { __LangType } from '../__generated';

const values = Object.values(Locale);

export class PotoLangsHandler extends PotoHandler {
	record: Partial<Record<LocaleString, any>> = {};

	getKey(lang: string, message: string) {
		let value: any = this.record[lang as LocaleString];

		for (const i of message.split('_')) {
			value = value[i];
		}

		if (typeof value !== 'string') {
			return undefined;
			// throw new Error(`${message} is not a string`);
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
			if (!values.includes(i.name as any)) {
				this.logger.fatal(`Invalid lang [${i.name}]`);
				continue;
			}
			this.record[i.name as LocaleString] = i.file;
		}
	}
}
