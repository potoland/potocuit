export type OKFunction<T> = (value: T) => void;
export type StopFunction = (error: Error) => void;
export type NextFunction<T = unknown> = (data: T) => void;
export type PassFunction = () => void;

export type MiddlewareContext<T = any, C = any> = (context: {
	context: C;
	next: NextFunction<T>;
	stop: StopFunction;
	pass: PassFunction;
}) => any;
export type MetadataMiddleware<T extends MiddlewareContext> = Parameters<Parameters<T>[0]['next']>[0];
export type CommandMetadata<T extends Readonly<MiddlewareContext[]>> = T extends readonly [infer first, ...infer rest]
	? first extends MiddlewareContext
		? MetadataMiddleware<first> & (rest extends MiddlewareContext[] ? CommandMetadata<rest> : {})
		: {}
	: {};

export type OnOptionsReturnObject = Record<
	string,
	| {
			failed: false;
			value: any;
	  }
	| {
			failed: true;
			value: Error;
	  }
>;
