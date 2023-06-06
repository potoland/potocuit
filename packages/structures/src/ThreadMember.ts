import type { APIThreadMember, GatewayThreadMemberUpdateDispatchData, MakeRequired, ThreadMemberFlags } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { Base } from './extra/Base';
import { DiscordBase } from './extra/DiscordBase';

export type ThreadMemberData = GatewayThreadMemberUpdateDispatchData | APIThreadMember;

/**
 * A member that comes from a thread
 * @link https://discord.com/developers/docs/resources/channel#thread-member-object
 */
export class ThreadMember extends DiscordBase {
	constructor(rest: BiscuitREST, data: MakeRequired<ThreadMemberData, 'user_id'>) {
		super(rest, data.user_id);
		this.threadId = data.id;
		this.joinTimestamp = Date.parse(data.join_timestamp);
		this.flags = data.flags;

		if ('guild_id' in data) {
			this.guildId = data.guild_id;
		}
	}

	/**	ID of the thread */
	threadId?: string;

	/**	Time the user last joined the thread */
	joinTimestamp: number;

	/** Any user-thread settings, currently only used for notifications */
	flags: ThreadMemberFlags;

	/**	ID of the guild */
	guildId?: string;
}

/**
 * A member that comes from a thread emited on GUILD_CREATE event
 * @link https://discord.com/developers/docs/resources/channel#thread-member-object
 */
export class PartialThreadMember extends Base implements Omit<ThreadMember, 'id' | 'createdTimestamp' | 'createdAt'> {
	constructor(rest: BiscuitREST, data: ThreadMemberData) {
		super(rest);
		this.threadId = data.id;
		this.joinTimestamp = Date.parse(data.join_timestamp);
		this.flags = data.flags;

		if ('guild_id' in data) {
			this.guildId = data.guild_id;
		}
	}

	/**	ID of the thread */
	threadId?: string;

	/**	Time the user last joined the thread */
	joinTimestamp: number;

	/** Any user-thread settings, currently only used for notifications */
	flags: ThreadMemberFlags;

	/**	ID of the guild */
	guildId?: string;
}
