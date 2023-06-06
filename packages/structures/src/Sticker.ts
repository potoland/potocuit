import type { APISticker, StickerFormatType, StickerType } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { User } from './User';
import { DiscordBase } from './extra/DiscordBase';

export class Sticker extends DiscordBase {
	constructor(rest: BiscuitREST, data: APISticker) {
		super(rest, data.id);
		this.name = data.name;
		this.description = data.description?.length ? data.description : undefined;
		this.tags = data.tags.split(',');
		this.type = data.type;
		this.formatType = data.format_type;
		this.packId = data.pack_id;
		this.available = !!data.available;
		this.guildId = data.guild_id;
		this.sortValue = data.sort_value;

		if (data.user) {
			this.user = new User(this.rest, data.user);
		}
	}

	/**	name of the sticker */
	name: string;

	/** description of the sticker */
	description: string | undefined;

	/** autocomplete/suggestion tags for the sticker (max 200 characters) */
	tags: string[];

	/** type of sticker */
	type: StickerType;

	/** type of sticker format */
	formatType: StickerFormatType;

	/** for standard stickers, id of the pack the sticker is from */
	packId?: string;

	/**	whether this guild sticker can be used, may be false due to loss of Server Boosts */
	available?: boolean;

	/** id of the guild that owns this sticker */
	guildId?: string;

	/**	the user that uploaded the guild sticker */
	user?: User;

	/** the standard sticker's sort order within its pack */
	sortValue?: number;
}
