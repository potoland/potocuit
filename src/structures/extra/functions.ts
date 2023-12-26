import type { APIEmoji, APIPartialEmoji } from "@biscuitland/common";
import { DiscordEpoch, FormattingPatterns } from "@biscuitland/common";
import type { Cache } from "../../cache";
import type { EmojiResolvable } from "../../types/resolvables";

/** * Convert a timestamp to a snowflake. * @param timestamp The timestamp to convert. * @returns The snowflake. */
export function snowflakeToTimestamp(id: string): number {
	return (Number(id) >> 22) + DiscordEpoch;
}

export function channelLink(channelId: string, guildId?: string) {
	return `https://discord.com/channels/${guildId ?? "@me"}/${channelId}`;
}

export async function resolveEmoji(emoji: EmojiResolvable, cache: Cache): Promise<APIPartialEmoji | undefined> {
	if (typeof emoji === "string") {
		const groups: Partial<APIPartialEmoji> | undefined = emoji.match(FormattingPatterns.Emoji)?.groups;
		if (groups) {
			return { animated: !!groups.animated, name: groups.name!, id: groups.id! };
		}
		if (emoji.match(/\d{17,20}/g)) {
			const fromCache = (await cache.emojis?.get(emoji)) as APIEmoji | undefined;
			return fromCache && { animated: fromCache.animated, id: fromCache.id, name: fromCache.name };
		}
		if (emoji.includes("%")) {
			emoji = encodeURIComponent(emoji);
		}
		if (!emoji.includes(":")) {
			return { name: emoji, id: null };
		}
		return undefined;
	}

	const { id, name, animated } = emoji;
	if (!(id && name)) {
		const fromCache = (await cache.emojis?.get(id!)) as APIEmoji | undefined;
		if (fromCache) {
			return { animated: fromCache.animated, id: fromCache.id, name: fromCache.name };
		}
		return undefined;
	}
	return { id, name, animated: !!animated };
}

export function encodeEmoji(rawEmoji: APIPartialEmoji) {
	return rawEmoji?.id ? `${rawEmoji.name}:${rawEmoji.id}` : `${rawEmoji?.name}`;
}

export function hasProp<T extends Record<any, any>>(target: T, prop: keyof T) {
	if (!(prop in target)) {
		return;
	}
	if (typeof target[prop] === "string" && !target[prop].length) {
		return;
	}
	return true;
}
