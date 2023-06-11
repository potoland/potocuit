// quizas dejar esto como raw, qn mrd usa esto kek

// import type { APIGuildMember, APIThreadMember, GatewayThreadMemberUpdateDispatchData, MakeRequired, ThreadMemberFlags } from '@biscuitland/common';
// import type { BiscuitREST } from '@biscuitland/rest';
// import type { ObjectToLower } from '.';
// import { Base } from './extra/Base';
// import { DiscordBase } from './extra/DiscordBase';

// export type ThreadMemberData = GatewayThreadMemberUpdateDispatchData | APIThreadMember;


// export interface ThreadMember extends DiscordBase, ObjectToLower<MakeRequired<APIThreadMember, 'id'>> { }
// /**
//  * A member that comes from a thread
//  * @link https://discord.com/developers/docs/resources/channel#thread-member-object
//  */
// export class ThreadMember extends DiscordBase {
// 	constructor(rest: BiscuitREST, data: MakeRequired<ThreadMemberData, 'user_id'>) {
// 		super(rest, { ...data, id: data.user_id });
// 		// this.threadId = data.id;
// 		// this.joinTimestamp = Date.parse(data.join_timestamp);
// 		// this.flags = data.flags;

// 		// if ('guild_id' in data) {
// 		// 	this.guildId = data.guild_id;
// 		// }
// 	}

// 	/**	ID of the thread */
// 	// threadId?: string;

// 	// /**	Time the user last joined the thread */
// 	// joinTimestamp: number;

// 	// /** Any user-thread settings, currently only used for notifications */
// 	// flags: ThreadMemberFlags;

// 	// /**	ID of the guild */
// 	// guildId?: string;
// }

// /**
//  * A member that comes from a thread emited on GUILD_CREATE event
//  * @link https://discord.com/developers/docs/resources/channel#thread-member-object
//  */
// export class PartialThreadMember extends Base implements Omit<ThreadMember, 'id' | 'createdTimestamp' | 'createdAt'> {
// 	constructor(rest: BiscuitREST, data: ThreadMemberData) {
// 		super(rest);
// 		this.threadId = data.id;
// 		this.joinTimestamp = Date.parse(data.join_timestamp);
// 		this.flags = data.flags;

// 		if ('guild_id' in data) {
// 			this.guildId = data.guild_id;
// 		}
// 	}

// 	member?: APIGuildMember | undefined;
// 	userId: string;

// 	/**	ID of the thread */
// 	threadId?: string;

// 	/**	Time the user last joined the thread */
// 	joinTimestamp: number;

// 	/** Any user-thread settings, currently only used for notifications */
// 	flags: ThreadMemberFlags;

// 	/**	ID of the guild */
// 	guildId?: string;
// }
