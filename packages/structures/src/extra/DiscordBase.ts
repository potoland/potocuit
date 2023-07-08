import { toCamelCase } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { snowflakeToTimestamp } from '../index';
import { Base } from './Base';
import type { Cache } from '../cache';

export class DiscordBase<Data extends Record<string, any> = { id: string }> extends Base {
	id: string;
	constructor(
		rest: BiscuitREST,
		cache: Cache,
		/** Unique ID of the object */
		data: Data
	) {
		super(rest, cache);
		this.id = data.id;
		this._patchThis(data);
	}

	/**
	 * Create a timestamp for the current object.
	 */
	get createdTimestamp(): number {
		return snowflakeToTimestamp(this.id);
	}

	/**
	 * createdAt gets the creation Date instace of the current object.
	 */
	get createdAt(): Date | null {
		return new Date(this.createdTimestamp);
	}

	protected _patchThis(data: Record<string, any>) {
		Object.assign(this, toCamelCase(data));
		return this;
	}
}
