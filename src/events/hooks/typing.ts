import type { GatewayTypingStartDispatchData } from '../../common';

import type { BaseClient } from '../../client/base';
import { GuildMember } from '../../structures';
import { toCamelCase } from '../../common';

export const TYPING_START = (self: BaseClient, data: GatewayTypingStartDispatchData) => {
	return data.member
		? {
			...toCamelCase(data),
			member: new GuildMember(self, data.member, data.member.user!, data.guild_id!),
		}
		: toCamelCase(data);
};
