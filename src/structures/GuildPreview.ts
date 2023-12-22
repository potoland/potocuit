import type { APIGuildPreview, APIPartialGuild } from "@biscuitland/common";
import type { BaseClient } from "../client/base";
import { AnonymousGuild } from "./AnonymousGuild";

/**
 * Represent Discord Guild Preview Object
 * @link https://discord.com/developers/docs/resources/guild#guild-preview-object
 */
export class GuildPreview extends AnonymousGuild {
  constructor(client: BaseClient, data: APIGuildPreview) {
    super(client, data as APIPartialGuild);
  }
}
