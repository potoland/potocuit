import type { APIGuild } from "@biscuitland/common";
import type { Cache } from "..";
import { Guild } from "../../structures";
import { BaseResource } from "./default/base";

export class Guilds extends BaseResource {
  namespace = "guild";

  override async get(id: string) {
    const guild = (await super.get(id)) as APIGuild | undefined;
    return guild ? (new Guild(this.client, guild) as Guild) : undefined;
  }

  override async values() {
    const guilds = (await super.values()) as APIGuild[];
    return guilds.map((x) => new Guild(this.client, x));
  }

  override async remove(id: string) {
    await this.cache.adapter.remove(
      (
        await Promise.all([
          this.cache.members?.keys(id) ?? [],
          this.cache.roles?.keys(id) ?? [],
          this.cache.channels?.keys(id) ?? [],
          this.cache.emojis?.keys(id) ?? [],
          this.cache.stickers?.keys(id) ?? [],
          this.cache.voiceStates?.keys(id) ?? [],
          this.cache.presences?.keys(id) ?? [],
          this.cache.threads?.keys(id) ?? [],
          this.cache.stageInstances?.keys(id) ?? [],
        ])
      ).flat(),
    );

    await this.cache.adapter.removeRelationship(
      [
        this.cache.members?.hashId(id),
        this.cache.roles?.hashId(id),
        this.cache.channels?.hashId(id),
        this.cache.emojis?.hashId(id),
        this.cache.stickers?.hashId(id),
        this.cache.voiceStates?.hashId(id),
        this.cache.presences?.hashId(id),
        this.cache.threads?.hashId(id),
        this.cache.stageInstances?.hashId(id),
      ].filter(Boolean) as string[],
    );

    await super.remove(id);
  }

  override async set(id: string, data: any) {
    const bulkData: Parameters<Cache["bulkSet"]>[0] = [];

    for (const member of data.members ?? []) {
      if (!member.user?.id) {
        continue;
      }
      bulkData.push(["members", member, member.user.id, id]);
      bulkData.push(["users", member.user, member.user.id]);
      // await this.cache.members.set(member.user.id, id, member);
    }

    for (const role of data.roles ?? []) {
      bulkData.push(["roles", role, role.id, id]);
      // await this.cache.roles.set(role.id, id, role);
    }

    for (const channel of data.channels ?? []) {
      bulkData.push(["channels", channel, channel.id, id]);
      // await this.cache.channels.set(channel.id, id, channel);
    }

    for (const emoji of data.emojis ?? []) {
      bulkData.push(["emojis", emoji, emoji.id, id]);
      // await this.cache.emojis.set(emoji.id, id, emoji);
    }

    for (const sticker of data.stickers ?? []) {
      bulkData.push(["stickers", sticker, sticker.id, id]);
      // await this.cache.stickers.set(sticker.id, id, sticker);
    }

    for (const voiceState of data.voice_states ?? []) {
      bulkData.push(["voiceStates", voiceState, voiceState.user_id, id]);
      // await this.cache.voiceStates.set(voiceState.user_id, id, voiceState);
    }

    for (const presence of data.presences ?? []) {
      bulkData.push(["presences", presence, presence.user.id, id]);
      // await this.cache.presences.set(presence.user.id, id, presence);
    }

    for (const thread of data.threads ?? []) {
      bulkData.push(["threads", thread, thread.id, id]);
      // await this.cache.threads.set(thread.id, id, thread);
    }

    for (const instance of data.stage_instances ?? []) {
      bulkData.push(["stageInstances", instance, instance.id, id]);
      // await this.cache.threads.set(thread.id, id, thread);
    }

    // delete data.voice_states;
    // delete data.members;
    // delete data.channels;
    // delete data.threads;
    // delete data.presences;
    // delete data.stage_instances;
    // delete data.guild_scheduled_events;

    // delete data.roles;
    // delete data.emojis;
    // delete data.stickers;

    // delete data.guild_hashes;

    const {
      voice_states,
      members,
      channels,
      threads,
      presences,
      stage_instances,
      guild_scheduled_events,
      roles,
      emojis,
      stickers,
      guild_hashes,
      ...guild
    } = data;

    // // deprecated
    // delete data.region;

    bulkData.push(["guilds", guild, id]);

    await this.cache.bulkSet(bulkData);

    // await super.set(id, data);
  }
}
