export type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends Record<any, any> ? DeepPartial<T[K]> : T[K] extends (infer I)[] ? DeepPartial<I>[] : T[K];
};
