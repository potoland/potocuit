import type { GatewayTypingStartDispatchData } from '@biscuitland/common';

import { toCamelCase } from '@biscuitland/common';
import { GuildMember } from '../../structures';
import type { BaseClient } from '../../client/base';

export const TYPING_START = (
	self: BaseClient,
	data: GatewayTypingStartDispatchData
) => {
	return data.member
		? {
			...toCamelCase(data),
			member: new GuildMember(
				self.rest,
				self.cache,
				data.member,
				data.member.user!,
				data.guild_id!
			),
		}
		: toCamelCase(data);
};
