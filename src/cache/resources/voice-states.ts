import type { GatewayVoiceState } from '../../common';
import { GuildRelatedResource } from './default/guild-related';

export class VoiceStates extends GuildRelatedResource<VoiceStateResource> {
	namespace = 'voice-state';

	override parse(data: any, _id: string, guild_id: string): VoiceStateResource {
		data.guild_id = guild_id;
		delete data.member;
		return data;
	}
}

export type VoiceStateResource = Omit<GatewayVoiceState, 'member'> & { guild_id: string };
