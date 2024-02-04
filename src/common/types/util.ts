import type { GatewayIntentBits, PermissionFlagsBits } from '..';

export type ToClass<T, This> = new (
	...args: any[]
) => {
		[K in keyof T]: T[K] extends (...args: any[]) => any
		? ReturnType<T[K]> extends Promise<T>
		? (...args: Parameters<T[K]>) => Promise<This>
		: ReturnType<T[K]> extends T
		? (...args: Parameters<T[K]>) => This
		: T[K]
		: T[K];
	};

export type StringToNumber<T extends string> = T extends `${infer N extends number}` ? N : never;

export type MakePartial<T, K extends keyof T> = T & { [P in K]?: T[P] };

export type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends Record<any, any>
	? DeepPartial<T[K]>
	: T[K] extends (infer I)[]
	? DeepPartial<I>[]
	: T[K];
};

export type OmitInsert<T, K extends keyof T, I> = I extends [] ? Omit<T, K> & I[number] : Omit<T, K> & I;

export type IntentStrings = (keyof typeof GatewayIntentBits)[];

export type PermissionStrings = (keyof typeof PermissionFlagsBits)[];

export type RestOrArray<T> = T[] | [T[]];

export interface StructWhen<Prop = any, State extends keyof StructWhen = 'cached'> {
	cached: Prop | undefined;
	api: State extends 'api' ? Prop : undefined;
	create: State extends 'create' ? Prop : undefined;
}

export type StructStates = keyof StructWhen;

export type StructPropState<Prop, State extends StructStates, Select extends StructStates> = StructWhen<
	Prop,
	Select
>[State];

export type WithID<More> = { id: string } & More;

export type Tail<A> = A extends [unknown, ...infer rest]
	? rest
	: A extends [unknown]
	? []
	: A extends (infer first)[]
	? first[]
	: never;

export type ValueOf<T> = T[keyof T];

export type ArrayFirsElement<A> = A extends [...infer arr] ? arr[0] : never;

export type RestToKeys<T extends unknown[]> = T extends [infer V, ...infer Keys]
	? { [K in Extract<Keys[number], string>]: V }
	: never;

export type Identify<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

export type TypeArray<T> = T | T[];

export type When<T extends boolean, A, B = never> = T extends true ? A : B;

export type If<T extends boolean, A, B = null> = T extends true ? A : B extends null ? A | null : B;

export type PickPartial<T, K extends keyof T> = {
	[P in keyof T]?: T[P] | undefined;
} & {
		[P in K]: T[P];
	};

export type MakeRequired<T, K extends keyof T> = T & { [P in K]-?: NonFalsy<T[P]> };

export type NonFalsy<T> = T extends false | 0 | '' | null | undefined | 0n ? never : T;

export type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
	? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
	: Lowercase<S>;

export type SnakeCase<S extends string> = S extends `${infer A}${infer Rest}`
	? A extends Uppercase<A>
	? `_${Lowercase<A>}${SnakeCase<Rest>}`
	: `${A}${SnakeCase<Rest>}`
	: Lowercase<S>;

export type ObjectToLower<T> = Identify<{
	[K in keyof T as CamelCase<Exclude<K, symbol | number>>]: T[K] extends unknown[]
	? Identify<ObjectToLower<T[K][0]>[]>
	: T[K] extends object
	? Identify<ObjectToLower<T[K]>>
	: T[K];
}>;
export type ObjectToSnake<T> = Identify<{
	[K in keyof T as SnakeCase<Exclude<K, symbol | number>>]: T[K] extends unknown[]
	? Identify<ObjectToSnake<T[K][0]>[]>
	: T[K] extends object
	? Identify<ObjectToSnake<T[K]>>
	: T[K];
}>;

export type UnionToTuple<U, A extends any[] = []>
	= (U extends never ? never : ((u: U) => U) extends never ? never : (arg: ((u: U) => U)) => never) extends (arg: infer I) => void
	? I extends (_: never) => infer W ? UnionToTuple<Exclude<U, W>, [W, ...A]> : A
	: never;
