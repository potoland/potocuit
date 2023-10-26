// este sera el archivo mas funable
// war crimes

export type ToClass<T, This> = new (...args: any[]) => {
	[K in keyof T]: T[K] extends (...args: any[]) => any
	? ReturnType<T[K]> extends Promise<T>
	? (...args: Parameters<T[K]>) => Promise<This>
	: ReturnType<T[K]> extends T
	? (...args: Parameters<T[K]>) => This
	: T[K]
	: T[K]
};


export type StringToNumber<T extends string> = T extends `${infer N extends number}` ? N : never;

export type MakePartial<T, K extends keyof T> = {
	[P in keyof T]: T[P];
} & {
		[P in K]?: T[P] | undefined;
	};

type ResultType<T> = [T, undefined] | [undefined, Error];

export type Result<T, P extends boolean> = P extends true
	? Promise<ResultType<T>>
	: ResultType<T>;
