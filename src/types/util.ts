type ToClass<T, This> = new (...args: any[]) => {
	[K in keyof T]: T[K] extends (...args: any[]) => any
	? ReturnType<T[K]> extends Promise<T>
	? (...args: Parameters<T[K]>) => Promise<This>
	: ReturnType<T[K]> extends T
	? (...args: Parameters<T[K]>) => This
	: T[K]
	: T[K]
};
