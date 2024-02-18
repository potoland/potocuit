import { readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { EmbedColors, type ColorResolvable, type Logger, type ObjectToLower, type ObjectToSnake } from '..';

/**
 * Resolves the color to a numeric representation.
 * @param color The color to resolve.
 * @returns The numeric representation of the color.
 */
export function resolveColor(color: ColorResolvable): number {
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

/**
 * Flattens an array to a certain depth.
 * @param arr The array to flatten.
 * @returns The flattened array.
 */
export function fastFlat<A extends any[]>(arr: A): FlatArray<A, 1>[] {
	let newArr: any[] = [];
	for (const element of arr) {
		newArr = newArr.concat(element);
	}
	return newArr as FlatArray<A, 1>[];
}

/**
 * Creates a new array with the results of calling a provided function on every element in the array.
 * @param arr The array to iterate over.
 * @param fn The function that produces an element of the new array.
 * @returns A new array with the results of calling the provided function on every element in the array.
 */
export function fastMap<U, T extends any[]>(arr: T, fn: (value: T[number], index: number, array: T) => U): U[] {
	const newArr: U[] = [];
	let key = 0;

	for (const value of arr) {
		newArr.push(fn(value, key, arr));
		key++;
	}

	return newArr;
}

/**
 * Delays the resolution of a Promise by the specified time.
 * @param time The time in milliseconds to delay the resolution.
 * @param result The value to resolve with after the delay.
 * @returns A Promise that resolves after the specified time with the provided result.
 */
export function delay<T>(time: number, result?: T): Promise<T> {
	return setTimeout(time, result);
}

/**
 * Checks if a given value is an object.
 * @param o The value to check.
 * @returns `true` if the value is an object, otherwise `false`.
 */
export function isObject(o: any): boolean {
	return o && typeof o === 'object' && !Array.isArray(o);
}

/**
 * Merges multiple options objects together, deeply extending objects.
 * @param defaults The default options object.
 * @param options Additional options objects to merge.
 * @returns The merged options object.
 */
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

/**
 * Splits an array into two arrays based on the result of a predicate function.
 * @param arr The array to split.
 * @param func The predicate function used to test elements of the array.
 * @returns An object containing two arrays: one with elements that passed the test and one with elements that did not.
 */
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

/**
 * Represents a base handler class.
 */
export class BaseHandler {
	/**
	 * Initializes a new instance of the BaseHandler class.
	 * @param logger The logger instance.
	 */
	constructor(protected logger: Logger) {}

	/**
	 * Filters a file path.
	 * @param path The path to filter.
	 * @returns `true` if the path passes the filter, otherwise `false`.
	 */
	protected filter = (path: string) => !!path;

	/**
	 * Recursively retrieves all files in a directory.
	 * @param dir The directory path.
	 * @returns A Promise that resolves to an array of file paths.
	 */
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

	/**
	 * Loads files from given paths.
	 * @param paths The paths of the files to load.
	 * @returns A Promise that resolves to an array of loaded files.
	 */
	protected async loadFiles<T extends NonNullable<unknown>>(paths: string[]): Promise<T[]> {
		return Promise.all(paths.map(path => magicImport(path).then(file => file.default ?? file)));
	}

	/**
	 * Loads files from given paths along with additional information.
	 * @param paths The paths of the files to load.
	 * @returns A Promise that resolves to an array of objects containing name, file, and path.
	 */
	protected async loadFilesK<T>(paths: string[]): Promise<{ name: string; file: T; path: string }[]> {
		return Promise.all(
			paths.map(path =>
				magicImport(path).then(file => {
					return {
						name: basename(path),
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

export type OnFailCallback = (error: unknown) => any;
