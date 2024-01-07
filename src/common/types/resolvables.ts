import type { APIPartialEmoji, EmbedColors } from '..';
import { GuildMember } from '../../structures';

export type EmojiResolvable = string | Partial<APIPartialEmoji> | `<${string | undefined}:${string}:${string}>`;
export type GuildMemberResolvable = string | Partial<GuildMember>;
export type ColorResolvable = string | number | keyof typeof EmbedColors | "Random" | [number, number, number];
