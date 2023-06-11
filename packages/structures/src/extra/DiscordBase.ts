import { toCamelCase } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { snowflakeToTimestamp } from '../index';
import { Base } from './Base';


export class DiscordBase extends Base {
	id: string;
	constructor(
		rest: BiscuitREST,
		/** Unique ID of the object */
		data: { id: string }
	) {
		super(rest);
		this.id = data.id;
		Object.assign(this, toCamelCase(data));
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
}
