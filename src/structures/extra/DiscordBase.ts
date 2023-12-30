import type { GuildBased, GuildRelated, NonGuildBased } from '../../cache';
import type { BaseClient } from '../../client/base';
import { DeepPartial } from '../../common';
import { type Identify } from '../../common';
import { Base } from './Base';
import { snowflakeToTimestamp } from './functions';

export class DiscordBase<Data extends Record<string, any> = { id: string }> extends Base {
	id: string;
	constructor(
		client: BaseClient,
		/** Unique ID of the object */
		data: Data,
	) {
		super(client);
		this.id = data.id;
		this._patchThis(data);
	}

	/**
	 * Create a timestamp for the current object.
	 */
	get createdTimestamp() {
		return snowflakeToTimestamp(this.id);
	}

	/**
	 * createdAt gets the creation Date instace of the current object.
	 */
	get createdAt() {
		return new Date(this.createdTimestamp);
	}

	protected _patchCache<T>(data: Identify<DeepPartial<T>>, cacheType: NonGuildBased | GuildRelated): Promise<this>;
	protected _patchCache<T>(data: Identify<DeepPartial<T>>, cacheType: GuildBased, guildId: string): Promise<this>;
	protected async _patchCache<T>(
		data: Identify<DeepPartial<T>>,
		cacheType: NonGuildBased | GuildBased | GuildRelated,
		guildId?: string,
	) {
		const cache = this.cache[cacheType]!;

		await this.cache.adapter.patch(
			!guildId,
			'hashGuildId' in cache ? cache.hashGuildId(this.id, guildId) : cache.hashId(this.id),
			data,
		);

		return this._patchThis(data);
	}
}
