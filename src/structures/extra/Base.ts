import { toCamelCase } from '@biscuitland/common';
import { Router } from '@biscuitland/rest';
import type { BaseClient } from '../../client/base';

/** */
export abstract class Base {
	constructor(client: BaseClient) {
		Object.assign(this, { client });
	}

	get rest() {
		return this.client.rest;
	}

	get cache() {
		return this.client.cache;
	}

	get api() {
		const rest = this.rest;
		return Router.prototype.createProxy.call({
			rest,
			noop: () => {
				return;
			},
			createProxy(route?: string[]) {
				return Router.prototype.createProxy.call({ ...this, rest }, route);
			},
		});
	}

	protected _patchThis(data: Record<string, any>) {
		Object.assign(this, toCamelCase(data));
		return this;
	}

	readonly client!: BaseClient;
}
