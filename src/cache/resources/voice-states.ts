import type { GatewayVoiceState } from '../../common';
import { GuildRelatedResource } from './default/guild-related';

export class VoiceStates extends GuildRelatedResource<VoiceStateResource> {
	namespace = 'voice-state';

	override parse(data: any, id: string, guild_id: string): VoiceStateResource {
		const modified = super.parse(data, id, guild_id)
		const { member, ...rest } = modified
		return rest;
	}
}

export type VoiceStateResource = Omit<GatewayVoiceState, 'member'> & { guild_id: string };
