import { APIPartialEmoji } from "@biscuitland/common";
import { GuildMember } from "../structures/GuildMember";

export type EmojiResolvable = string | Partial<APIPartialEmoji> | `<${string | undefined}:${string}:${string}>`;
export type GuildMemberResolvable = string | Partial<GuildMember>;
