export * from "./application_command";
export * from "./auto_moderation";
export * from "./channel";
export * from "./dispatch";
export * from "./guild";
export * from "./integration";
export * from "./interactions";
export * from "./invite";
export * from "./message";
export * from "./presence";
export * from "./stage";
export * from "./thread";
export * from "./typing";
export * from "./user";
export * from "./voice";
export * from "./webhook";

import type { CamelCase } from "@biscuitland/common";
import type * as RawEvents from "./index";

export type PotocuitEvents = {
	[X in keyof typeof RawEvents as CamelCase<X>]: ReturnType<(typeof RawEvents)[X]>;
};
export type DropT<T, R> = {
	[P in keyof T as T[P] extends R ? never : P]: T[P] extends R ? never : T[P];
};

export type DropTI<T, U> = {
	[P in keyof T as U extends T[P] ? never : P]: U extends T[P] ? never : T[P];
};

export type KeepT<T, R> = {
	[P in keyof T as T[P] extends R ? P : never]: T[P] extends R ? T[P] : never;
};

export type KeepTI<T, U> = {
	[P in keyof T as U extends T[P] ? P : never]: U extends T[P] ? T[P] : never;
};

export type Clean<T> = DropT<T, never>;

export type Identify<T> = T extends infer U
	? {
		[K in keyof U]: U[K];
	}
	: never;

export type PartialAvoid<U, T> = Identify<KeepT<T, U> & Partial<T>>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type PartialClass<T> = PartialAvoid<Function, T>;
