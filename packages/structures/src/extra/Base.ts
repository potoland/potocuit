import type { BiscuitREST } from '@biscuitland/rest';
import { Router } from '@biscuitland/rest';

/** */
export abstract class Base {
	constructor(rest: BiscuitREST) {
		Object.defineProperty(this, 'rest', {
			value: rest,
			writable: false
		});

	}

	get api() {
		return Router.prototype.createProxy.call({
			rest: this.rest,
			noop: () => { return; },
			createProxy(route?: string[]) {
				return Router.prototype.createProxy.call(this, route);
			}
		});
	}

	rest!: BiscuitREST;
}
