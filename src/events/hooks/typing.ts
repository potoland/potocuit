import type { GatewayTypingStartDispatchData } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import type { Cache } from '../../cache';

import { toCamelCase } from '@biscuitland/common';
import { GuildMember } from '../../structures/GuildMember';

export const TYPING_START = (
	rest: BiscuitREST,
	cache: Cache,
	data: GatewayTypingStartDispatchData
) => {
	return data.member
		? {
			...toCamelCase(data),
			member: new GuildMember(
				rest,
				cache,
				data.member,
				data.member.user!,
				data.guild_id!
			),
		}
		: toCamelCase(data);
};
