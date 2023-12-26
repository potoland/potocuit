import type { GatewayVoiceState } from "@biscuitland/common";
import { GuildRelatedResource } from "./default/guild-related";

export class VoiceStates extends GuildRelatedResource<PotoVoiceState> {
	namespace = "voice-state";

	override parse(data: any, _id: string, guild_id: string): PotoVoiceState {
		data.guild_id = guild_id;
		delete data.member;
		return data;
	}
}

export type PotoVoiceState = Omit<GatewayVoiceState, "member"> & { guild_id: string };
