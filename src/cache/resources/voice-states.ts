import type { GatewayVoiceState } from '../../common';
import { GuildRelatedResource } from './default/guild-related';

export class VoiceStates extends GuildRelatedResource<VoiceStateResource> {
	namespace = 'voice-state';

	override parse(data: any, id: string, guild_id: string): VoiceStateResource {
		const { member, ...rest } = super.parse(data, id, guild_id);
		return rest;
	}
}

export type VoiceStateResource = Omit<GatewayVoiceState, 'member'> & { guild_id: string };
