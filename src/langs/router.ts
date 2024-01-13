import type { LocaleString } from 'discord-api-types/v10';

export const LangRouter = (defaultLang: LocaleString, langs: Partial<Record<LocaleString, any>>) => {
	function createProxy(route = [] as string[], args: any[] = []): unknown {
		const noop = () => {
			return;
		};
		return new Proxy(noop, {
			get: (_, key: string) => {
				if (key === 'get') {
					function getValue(locale: LocaleString) {
						let value = langs[locale] as Record<string, any>;
						for (const i of route) value = value[i];
						return value;
					}
					return (locale?: LocaleString) => {
						let object;
						try {
							object = getValue(locale ?? defaultLang);
						} catch {
							object = getValue(defaultLang);
						}
						const value = typeof object === 'function' ? object(...args) : object;
						return value;
					};
				}
				return createProxy([...route, key], args);
			},
			apply: (...[, , args]) => {
				return createProxy(route, args);
			},
		}) as unknown;
	}
	return createProxy;
};

type ParseLocale<T extends Record<string, any>> = {
	[K in keyof T]: T[K] extends (...args: any[]) => any
		? (...args: Parameters<T[K]>) => { get(locale?: LocaleString): any }
		: T[K] extends string
		  ? { get(locale?: LocaleString): T[K] }
		  : T[K] extends unknown[]
			  ? { get(locale?: LocaleString): T[K] }
			  : T[K] extends Record<string, any>
				  ? ParseLocales<T[K]> & { get(locale?: LocaleString): T[K] }
				  : never;
};

export type ParseLocales<T extends Record<string, any>> = ParseLocale<T> & { get(locale?: LocaleString): T };
