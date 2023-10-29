import type { MiddlewareContext, PotoCommandOption } from './commands';

export * from './types';
export * from './cache';
export * from './structures/extra/functions';
export * from './commands';
export * from './client';
export * from './types';
export * from './cache';
export * from './structures/extra/functions';
export * from './commands';
export * from './events';

export function throwError(msg: string): never {
	throw new Error(msg);
}

export function createOption<T = PotoCommandOption>(data: T) {
	return data;
}

export function createMiddleware<M, T = MiddlewareContext<M>>(data: T) {
	return data;
}


import type ts from 'typescript';
import type { EmptyDecorator } from 'ts-macros';
import { $$raw } from 'ts-macros';

function $renameClass(newName: string): EmptyDecorator {
	return $$raw!((ctx, newNameNode: ts.StringLiteral) => {
		const target = ctx.thisMacro.target as ts.ClassDeclaration;
		return ctx.factory.createClassDeclaration(
			target.modifiers?.filter(m => m.kind !== ctx.ts.SyntaxKind.Decorator),
			ctx.factory.createIdentifier(newNameNode.text),
			target.typeParameters,
			target.heritageClauses,
			target.members
		);
	});
}

function $addDebugMethod(): EmptyDecorator {
	return $$raw!(ctx => {
		const target = ctx.thisMacro.target as ts.ClassDeclaration;
		return ctx.factory.createClassDeclaration(
			target.modifiers?.filter(m => m.kind !== ctx.ts.SyntaxKind.Decorator),
			target.name,
			target.typeParameters,
			target.heritageClauses,
			[
				...target.members,
				ctx.factory.createMethodDeclaration(
					undefined,
					undefined,
					'debug',
					undefined,
					undefined,
					[],
					undefined,
					ctx.factory.createBlock(ctx.transformer.strToAST(`
                        console.log(
                            "${target.name?.getText()} ", "{\\n",
                                ${target.members.filter(m => ctx.ts.isPropertyDeclaration(m) && ctx.ts.isIdentifier(m.name)).map(m => `"${(m.name as ts.Identifier).text}: ", this.${(m.name as ts.Identifier).text}}`).join(',"\\n",')},
                            "\\n}"
                        )
                    `))
				)
			]
		);
	});
}

@$renameClass!('Test')
@$addDebugMethod!()
class Owo {
	propA: number;
	propB: string;
	constructor(a: number, b: string) {
		this.propA = a;
		this.propB = b;
	}
}

new Test(1, 'one')
	.debug;
