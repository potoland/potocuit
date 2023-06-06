import type { APIEmoji } from '@biscuitland/common';

export class Emoji {
	constructor(data: APIEmoji) {
		this.name = data.name ?? undefined;
		this.animated = !!data.animated;
		this.avialable = !!data.available;
		this.requireColons = !!data.require_colons;
	}

	readonly id?: string;

	name?: string;
	animated: boolean;
	avialable: boolean;
	requireColons: boolean;
}
