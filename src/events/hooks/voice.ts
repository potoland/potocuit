import type {
	GatewayVoiceServerUpdateDispatchData,
	GatewayVoiceStateUpdateDispatchData,
} from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../../cache';

import { toCamelCase } from '@biscuitland/common';
import { GuildMember } from '../../structures/GuildMember';

export const VOICE_SERVER_UPDATE = (
	_rest: BiscuitREST,
	_cache: Cache,
	data: GatewayVoiceServerUpdateDispatchData
) => {
	return toCamelCase(data);
};

export const VOICE_STATE_UPDATE = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayVoiceStateUpdateDispatchData
) => {
	return data.member?.user
		? {
			...toCamelCase(data),
			member: new GuildMember(
				rest,
				cache,
				data.member,
				data.member?.user,
				data.guild_id!
			),
		}
		: toCamelCase(data);
};
