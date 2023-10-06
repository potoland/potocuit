import type { BiscuitREST } from '@biscuitland/rest';
import { Router } from '@biscuitland/rest';
import type { Cache } from '../../cache';
import { toCamelCase } from '@biscuitland/common';

/** */
export abstract class Base {
	constructor(rest: BiscuitREST, cache: Cache) {
		Object.defineProperty(this, 'rest', {
			value: rest,
			writable: false
		});
		Object.defineProperty(this, 'cache', {
			value: cache,
			writable: false
		});
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

	rest!: BiscuitREST;
	cache!: Cache;
}
