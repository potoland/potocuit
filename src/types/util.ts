import type { GatewayIntentBits, PermissionFlagsBits } from '@biscuitland/common';

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

export type MakePartial<T, K extends keyof T> = {
	[P in keyof T]: T[P];
} & {
	[P in K]?: T[P] | undefined;
};

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

export type WithID<More> = { id?: string } & More;
