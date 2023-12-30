import type { BaseClient } from '../../client/base';
import type { LocaleString } from '../../common';
import { ApplicationCommandType } from '../../common';
import { MenuCommandContext } from './menucontext';
import { MiddlewareContext, NextFunction, PassFunction, StopFunction } from './shared';

export class ContextMenuCommand {
	middlewares: MiddlewareContext[] = [];

	__filePath?: string;
	__t?: { name: string; description: string };

	guild_id?: string[];
	name!: string;
	type!: ApplicationCommandType.User | ApplicationCommandType.Message;
	nsfw?: boolean;
	description!: string;
	default_member_permissions?: string;
	permissions?: bigint;
	dm?: boolean;
	name_localizations?: Partial<Record<LocaleString, string>>;
	description_localizations?: Partial<Record<LocaleString, string>>;

	/** @internal */
	static __runMiddlewares(
		context: MenuCommandContext<any, any>,
		middlewares: readonly MiddlewareContext[],
		global: boolean,
	): Promise<[any, undefined] | [undefined, Error] | 'pass'> {
		if (!middlewares.length) {
			return Promise.resolve([{}, undefined]);
		}
		const metadata: Record<string, any> = {};
		let index = 0;

		return new Promise((res) => {
			let running = true;
			const pass: PassFunction = () => {
				if (!running) {
					return;
				}
				running = false;
				return res('pass');
			};
			const next: NextFunction<any> = (obj) => {
				if (!running) {
					return;
				}
				Object.assign(metadata, obj ?? {});
				if (++index >= middlewares.length) {
					running = false;
					// @ts-expect-error globalMetadata doesnt exist, but is used for global middlewares
					context[global ? 'globalMetadata' : 'metadata'] = metadata;
					return res([metadata, undefined]);
				}
				middlewares[index]({ context, next, stop, pass });
			};
			const stop: StopFunction = (err) => {
				if (!running) {
					return;
				}
				running = false;
				return res([undefined, err]);
			};
			middlewares[0]({ context, next, stop, pass });
		});
	}

	/** @internal */
	__runMiddlewares(context: MenuCommandContext<'base', any, []>) {
		return ContextMenuCommand.__runMiddlewares(context, this.middlewares, false);
	}

	/** @internal */
	__runGlobalMiddlewares(context: MenuCommandContext<'base', any, []>) {
		return ContextMenuCommand.__runMiddlewares(context, context.client.options?.globalMiddlewares ?? [], true);
	}

	toJSON() {
		return {
			name: this.name,
			type: this.type,
			nsfw: this.nsfw || false,
			description: this.description,
			name_localizations: this.name_localizations,
			description_localizations: this.description_localizations,
			guild_id: this.guild_id,
			dm_permission: this.dm,
			default_member_permissions: this.default_member_permissions,
		};
	}

	async reload() {
		delete require.cache[this.__filePath!];
		const __tempCommand = await import(this.__filePath!).then((x) => x.default ?? x);

		Object.setPrototypeOf(this, __tempCommand.prototype);
	}

	run?(context: MenuCommandContext<any, any>): any;
	onRunError?(context: MenuCommandContext<any, any>, error: unknown): any;
	onMiddlewaresError?(context: MenuCommandContext<'base', any, []>, error: Error): any;

	onInternalError(client: BaseClient, error?: unknown): any {
		client.logger.fatal(error);
	}
}
