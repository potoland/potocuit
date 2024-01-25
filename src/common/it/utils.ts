import { readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { EmbedColors, type ColorResolvable, type Logger, type ObjectToLower, type ObjectToSnake } from '..';

export function resolveColor(color: ColorResolvable) {
	switch (typeof color) {
		case 'string':
			if (color === 'Random') return Math.floor(Math.random() * (0xffffff + 1));
			if (color.startsWith('#')) return Number.parseInt(color.slice(1), 16);
			if (color in EmbedColors) return EmbedColors[color as keyof typeof EmbedColors];
			return EmbedColors.Default;
		case 'number':
			return color;
		case 'object':
			if (Array.isArray(color)) return (color[0] << 16) + (color[1] << 8) + color[2];
			break;
		default:
			return color;
	}
	return color;
}

export function fastFlat<A extends any[]>(arr: A): FlatArray<A, 1>[] {
	let newArr: any[] = [];
	for (const element of arr) {
		newArr = newArr.concat(element);
	}
	return newArr as FlatArray<A, 1>[];
}

export function delay<T>(time: number, result?: T): Promise<T> {
	return setTimeout(time, result);
}

export function isObject(o: any) {
	return o && typeof o === 'object' && !Array.isArray(o);
}

export function MergeOptions<T>(defaults: any, ...options: any[]): T {
	const option = options.shift();
	if (!option) {
		return defaults;
	}

	return MergeOptions(
		{
			...option,
			...Object.fromEntries(
				Object.entries(defaults).map(([key, value]) => [
					key,
					isObject(value) ? MergeOptions(value, option?.[key] || {}) : option?.[key] ?? value,
				]),
			),
		},
		...options,
	);
}

export function filterSplit<Element, Predicate extends (value: Element) => boolean>(arr: Element[], func: Predicate) {
	const expect: Element[] = [];
	const never: Element[] = [];

	for (const element of arr) {
		const test = func(element);
		if (test) expect.push(element);
		else never.push(element);
	}

	return { expect, never };
}

export class BaseHandler {
	constructor(protected logger: Logger) {}

	protected filter = (path: string) => !!path;

	protected async getFiles(dir: string) {
		const files: string[] = [];

		for (const i of await readdir(dir, { withFileTypes: true })) {
			if (i.isDirectory()) {
				files.push(...(await this.getFiles(join(dir, i.name))));
			} else {
				if (this.filter(join(dir, i.name))) {
					files.push(join(dir, i.name));
				}
			}
		}

		return files;
	}

	protected async loadFiles<T extends NonNullable<unknown>>(paths: string[]): Promise<T[]> {
		return await Promise.all(paths.map(path => magicImport(path).then(file => file.default ?? file)));
	}

	protected async loadFilesK<T>(paths: string[]): Promise<{ name: string; file: T; path: string }[]> {
		return await Promise.all(
			paths.map(path =>
				magicImport(path).then(file => {
					return {
						name: basename(path), // .split('.')[0],
						file: file.default ?? file,
						path,
					};
				}),
			),
		);
	}
}

/**
 * Convert a camelCase object to snake_case.
 * @param target The object to convert.
 * @returns The converted object.
 */
export function toSnakeCase<Obj extends Record<string, any>>(target: Obj): ObjectToSnake<Obj> {
	const result: Record<string, any> = {};
	for (const [key, value] of Object.entries(target)) {
		switch (typeof value) {
			case 'string':
			case 'bigint':
			case 'boolean':
			case 'function':
			case 'number':
			case 'symbol':
			case 'undefined':
				result[ReplaceRegex.snake(key)] = value;
				break;
			case 'object':
				if (Array.isArray(value)) {
					result[ReplaceRegex.snake(key)] = value.map(prop =>
						typeof prop === 'object' && prop ? toSnakeCase(prop) : prop,
					);
					break;
				}
				if (isObject(value)) {
					result[ReplaceRegex.snake(key)] = toSnakeCase(value);
					break;
				}
				if (!Number.isNaN(value)) {
					result[ReplaceRegex.snake(key)] = null;
					break;
				}
				result[ReplaceRegex.snake(key)] = toSnakeCase(value);
				break;
		}
	}
	return result as ObjectToSnake<Obj>;
}

/**
 * Convert a snake_case object to camelCase.
 * @param target The object to convert.
 * @returns The converted object.
 */
export function toCamelCase<Obj extends Record<string, any>>(target: Obj): ObjectToLower<Obj> {
	const result: Record<string, any> = {};
	for (const [key, value] of Object.entries(target)) {
		switch (typeof value) {
			case 'string':
			case 'bigint':
			case 'boolean':
			case 'function':
			case 'symbol':
			case 'number':
			case 'undefined':
				result[ReplaceRegex.camel(key)] = value;
				break;
			case 'object':
				if (Array.isArray(value)) {
					result[ReplaceRegex.camel(key)] = value.map(prop =>
						typeof prop === 'object' && prop ? toCamelCase(prop) : prop,
					);
					break;
				}
				if (isObject(value)) {
					result[ReplaceRegex.camel(key)] = toCamelCase(value);
					break;
				}
				if (!Number.isNaN(value)) {
					result[ReplaceRegex.camel(key)] = null;
					break;
				}
				result[ReplaceRegex.camel(key)] = toCamelCase(value);
				break;
		}
	}
	return result as ObjectToLower<Obj>;
}

export const ReplaceRegex = {
	camel: (s: string) => {
		return s.toLowerCase().replace(/(_\S)/gi, a => a[1].toUpperCase());
	},
	snake: (s: string) => {
		return s.replace(/[A-Z]/g, a => `_${a.toLowerCase()}`);
	},
};

export async function magicImport(path: string) {
	try {
		return require(path);
	} catch {
		return eval('((path) => import(`file:///${path}`))')(path.split('\\').join('\\\\'));
	}
}
