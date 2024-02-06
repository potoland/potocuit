import type { BaseClient } from '../../client/base';
import { magicImport, type ApplicationCommandType, type LocaleString } from '../../common';
import type { RegisteredMiddlewares } from '../decorators';
import type { MenuCommandContext } from './menucontext';
import type { NextFunction, PassFunction, StopFunction } from './shared';

export abstract class ContextMenuCommand {
	middlewares: (keyof RegisteredMiddlewares)[] = [];

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
		context: MenuCommandContext<any>,
		middlewares: (keyof RegisteredMiddlewares)[],
		global: boolean,
	): Promise<undefined | Error | 'pass'> {
		if (!middlewares.length) {
			return Promise.resolve(undefined);
		}
		let index = 0;

		return new Promise(res => {
			let running = true;
			const pass: PassFunction = () => {
				if (!running) {
					return;
				}
				running = false;
				return res('pass');
			};
			const next: NextFunction<any> = obj => {
				if (!running) {
					return;
				}
				context[global ? 'globalMetadata' : 'metadata'] ??= {};
				// @ts-expect-error
				context[global ? 'globalMetadata' : 'metadata'][middlewares[index]] = obj;
				if (++index >= middlewares.length) {
					running = false;
					return res(undefined);
				}
				context.client.middlewares![middlewares[index]]({ context, next, stop, pass });
			};
			const stop: StopFunction = err => {
				if (!running) {
					return;
				}
				running = false;
				return res(err);
			};
			context.client.middlewares![middlewares[0]]({ context, next, stop, pass });
		});
	}

	/** @internal */
	__runMiddlewares(context: MenuCommandContext<any, never>) {
		return ContextMenuCommand.__runMiddlewares(context, this.middlewares as (keyof RegisteredMiddlewares)[], false);
	}

	/** @internal */
	__runGlobalMiddlewares(context: MenuCommandContext<any, never>) {
		return ContextMenuCommand.__runMiddlewares(
			context,
			(context.client.options?.globalMiddlewares ?? []) as (keyof RegisteredMiddlewares)[],
			true,
		);
	}

	toJSON() {
		return {
			name: this.name,
			type: this.type,
			nsfw: this.nsfw,
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
		const __tempCommand = await magicImport(this.__filePath!).then(x => x.default ?? x);

		Object.setPrototypeOf(this, __tempCommand.prototype);
	}

	abstract run?(context: MenuCommandContext<any>): any;
	onAfterRun?(context: MenuCommandContext<any>, error: unknown | undefined): any;
	onRunError?(context: MenuCommandContext<any>, error: unknown): any;
	onMiddlewaresError?(context: MenuCommandContext<any, never>, error: Error): any;

	onInternalError(client: BaseClient, error?: unknown): any {
		client.logger.fatal(error);
	}
}
