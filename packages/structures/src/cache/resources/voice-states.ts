import type { GatewayVoiceState } from '@biscuitland/common';
import { GuildBasedResource } from './default/guild-based';

export class VoiceStates extends GuildBasedResource<PotoVoiceState> {
	namespace = 'voice-state';

	override parse(data: any, _id: string, guild_id: string): PotoVoiceState {
		data.guild_id = guild_id;
		delete data.member;
		return data;
	}
}

export type PotoVoiceState = Omit<GatewayVoiceState, 'member'> & { guild_id: string };
