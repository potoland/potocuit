import { DefaultLocale } from "../commands";

export const LangRouter = (userLocale: string, defaultLang: string, langs: Partial<Record<string, any>>) => {
	function createProxy(route = [] as string[], args: any[] = []): DefaultLocale {
		const noop = () => {
			return;
		};
		return new Proxy(noop, {
			get: (_, key: string) => {
				if (key === 'get') {
					function getValue(locale?: string) {
						if (typeof locale === 'undefined') throw new Error('Undefined locale');
						let value = langs[locale] as Record<string, any>;
						for (const i of route) value = value[i];
						return value;
					}
					return (locale?: string) => {
						let object;
						try {
							object = getValue(locale ?? userLocale);
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
		})
	}
	return createProxy
};

type ParseLocale<T extends Record<string, any>> = {
	[K in keyof T]: T[K] extends (...args: any[]) => any
	? (...args: Parameters<T[K]>) => { get(locale?: string): any }
	: T[K] extends string
	? { get(locale?: string): T[K] }
	: T[K] extends unknown[]
	? { get(locale?: string): T[K] }
	: T[K] extends Record<string, any>
	? ParseLocales<T[K]> & { get(locale?: string): T[K] }
	: never;
};

export type ParseLocales<T extends Record<string, any>> = ParseLocale<T> & { get(locale?: string): T };
/**Code inspiration from: FreeAoi */
