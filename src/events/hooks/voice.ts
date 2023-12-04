import type {
	GatewayVoiceServerUpdateDispatchData,
	GatewayVoiceStateUpdateDispatchData,
} from '@biscuitland/common';
import type { BaseClient } from '../../client/base';
import { toCamelCase } from '@biscuitland/common';
import { GuildMember } from '../../structures';

export const VOICE_SERVER_UPDATE = (
	_self: BaseClient,
	data: GatewayVoiceServerUpdateDispatchData
) => {
	return toCamelCase(data);
};

export const VOICE_STATE_UPDATE = (
	self: BaseClient,
	data: GatewayVoiceStateUpdateDispatchData
) => {
	return data.member?.user
		? {
			...toCamelCase(data),
			member: new GuildMember(
				self.rest,
				self.cache,
				data.member,
				data.member?.user,
				data.guild_id!
			),
		}
		: toCamelCase(data);
};
