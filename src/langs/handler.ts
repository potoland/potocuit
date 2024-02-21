import { BaseHandler, Locale } from '../common';
import { LangRouter } from './router';

export class LangsHandler extends BaseHandler {
	values: Partial<Record<string, any>> = {};
	protected filter = (path: string) => path.endsWith('.js') || path.endsWith('.ts') || path.endsWith('.json');
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

	get(userLocale: string) {
		return LangRouter(userLocale, this.defaultLang ?? userLocale, this.values)();
	}

	async load(dir: string) {
		const files = await this.loadFilesK<Record<string, any>>(await this.getFiles(dir));
		for (const i of files) {
			const locale = i.name.split('.').slice(0, -1).join('.')
			if (!Object.values<string>(Locale).includes(locale))
				this.logger.warn(`[${locale}](${i.path.split(process.cwd()).slice(1).join(process.cwd())}) is not a valid DiscordLocale, loading anyways..`);
			this.values[locale] = i.file;
		}
	}
}
