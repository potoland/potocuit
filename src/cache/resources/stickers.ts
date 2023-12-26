import { GuildRelatedResource } from "./default/guild-related";
// import { Sticker } from '@potoland/structures';

export class Stickers extends GuildRelatedResource {
	namespace = "sticker";

	// override async get(id: string, guild: string) {
	// 	const rawSticker = await super.get(id, guild) as APISticker | undefined;
	// 	return rawSticker ? new Sticker(this.rest, this.cache, rawSticker) : undefined;
	// }

	// override async items(guild: string, options?: any) {
	// 	const emojis = await super.items(guild, options) as APISticker[];
	// 	return emojis.map(rawSticker => new Sticker(this.rest, this.cache, rawSticker));
	// }
}
