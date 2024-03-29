import type {
	RESTDeleteAPIChannelAllMessageReactionsResult,
	RESTDeleteAPIChannelMessageReactionResult,
	RESTDeleteAPIChannelMessageResult,
	RESTDeleteAPIChannelPermissionResult,
	RESTDeleteAPIChannelPinResult,
	RESTDeleteAPIChannelRecipientResult,
	RESTDeleteAPIChannelResult,
	RESTDeleteAPIChannelThreadMembersResult,
	RESTGetAPIChannelInvitesResult,
	RESTGetAPIChannelMessageReactionUsersQuery,
	RESTGetAPIChannelMessageReactionUsersResult,
	RESTGetAPIChannelMessageResult,
	RESTGetAPIChannelMessagesQuery,
	RESTGetAPIChannelMessagesResult,
	RESTGetAPIChannelPinsResult,
	RESTGetAPIChannelResult,
	RESTGetAPIChannelThreadMemberQuery,
	RESTGetAPIChannelThreadMemberResult,
	RESTGetAPIChannelThreadMembersQuery,
	RESTGetAPIChannelThreadMembersResult,
	RESTGetAPIChannelThreadsArchivedPrivateResult,
	RESTGetAPIChannelThreadsArchivedPublicResult,
	RESTGetAPIChannelThreadsArchivedQuery,
	RESTGetAPIChannelUsersThreadsArchivedResult,
	RESTGetAPIGuildWebhooksResult,
	RESTPatchAPIChannelJSONBody,
	RESTPatchAPIChannelMessageJSONBody,
	RESTPatchAPIChannelMessageResult,
	RESTPatchAPIChannelResult,
	RESTPostAPIChannelFollowersJSONBody,
	RESTPostAPIChannelFollowersResult,
	RESTPostAPIChannelInviteJSONBody,
	RESTPostAPIChannelInviteResult,
	RESTPostAPIChannelMessageCrosspostResult,
	RESTPostAPIChannelMessageJSONBody,
	RESTPostAPIChannelMessageResult,
	RESTPostAPIChannelMessagesBulkDeleteJSONBody,
	RESTPostAPIChannelMessagesBulkDeleteResult,
	RESTPostAPIChannelMessagesThreadsJSONBody,
	RESTPostAPIChannelMessagesThreadsResult,
	RESTPostAPIChannelThreadsJSONBody,
	RESTPostAPIChannelThreadsResult,
	RESTPostAPIChannelTypingResult,
	RESTPostAPIChannelWebhookJSONBody,
	RESTPostAPIChannelWebhookResult,
	RESTPostAPIGuildForumThreadsJSONBody,
	RESTPutAPIChannelMessageReactionResult,
	RESTPutAPIChannelPermissionJSONBody,
	RESTPutAPIChannelPermissionResult,
	RESTPutAPIChannelPinResult,
	RESTPutAPIChannelRecipientJSONBody,
	RESTPutAPIChannelRecipientResult,
	RESTPutAPIChannelThreadMembersResult,
} from '../../common';
import type { RestArguments } from '../api';
import type { ProxyRequestMethod } from '../Router';

export interface ChannelRoutes {
	channels(id: string): {
		//.
		get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIChannelResult>;
		//.
		patch(
			args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIChannelJSONBody>,
		): Promise<RESTPatchAPIChannelResult>;
		//.
		delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIChannelResult>;
		users: {
			(
				id: '@me',
			): {
				threads: {
					archived: {
						private: {
							//.
							get(
								args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIChannelThreadsArchivedQuery>,
							): Promise<RESTGetAPIChannelUsersThreadsArchivedResult>;
						};
					};
				};
			};
		};
		'thread-members': {
			//.
			get(
				args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIChannelThreadMembersQuery>,
			): Promise<RESTGetAPIChannelThreadMembersResult>;
			(
				id: '@me',
			): {
				//.
				put(args?: RestArguments<ProxyRequestMethod.Put>): Promise<RESTPutAPIChannelThreadMembersResult>;
				//.
				delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIChannelThreadMembersResult>;
			};
			(
				id: string,
			): {
				//.
				get(
					args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIChannelThreadMemberQuery>,
				): Promise<RESTGetAPIChannelThreadMemberResult>;
				//.
				put(args?: RestArguments<ProxyRequestMethod.Put>): Promise<RESTPutAPIChannelThreadMembersResult>;
				//.
				delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIChannelThreadMembersResult>;
			};
		};
		threads: {
			//.
			post(
				args: RestArguments<
					ProxyRequestMethod.Post,
					RESTPostAPIChannelThreadsJSONBody | RESTPostAPIGuildForumThreadsJSONBody
				>,
			): Promise<RESTPostAPIChannelThreadsResult>;
			archived: {
				public: {
					//.
					get(
						args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIChannelThreadsArchivedQuery>,
					): Promise<RESTGetAPIChannelThreadsArchivedPublicResult>;
				};
				private: {
					//.
					get(
						args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIChannelThreadsArchivedQuery>,
					): Promise<RESTGetAPIChannelThreadsArchivedPrivateResult>;
				};
			};
		};
		recipients: {
			(
				id: string,
			): {
				//.
				put(
					args?: RestArguments<ProxyRequestMethod.Put, RESTPutAPIChannelRecipientJSONBody>,
				): Promise<RESTPutAPIChannelRecipientResult>;
				//.
				delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIChannelRecipientResult>;
			};
		};
		pins: {
			//.
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIChannelPinsResult>;
			(
				id: string,
			): {
				//.
				put(args?: RestArguments<ProxyRequestMethod.Put>): Promise<RESTPutAPIChannelPinResult>;
				//.
				delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIChannelPinResult>;
			};
		};
		followers: {
			//.
			post(
				args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIChannelFollowersJSONBody>,
			): Promise<RESTPostAPIChannelFollowersResult>;
		};
		permissions: {
			(
				id: string,
			): {
				//.
				put(
					args?: RestArguments<ProxyRequestMethod.Put, RESTPutAPIChannelPermissionJSONBody>,
				): Promise<RESTPutAPIChannelPermissionResult>;
				//.
				delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIChannelPermissionResult>;
			};
		};
		invites: {
			//.
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIChannelInvitesResult>;
			//.
			post(
				args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIChannelInviteJSONBody>,
			): Promise<RESTPostAPIChannelInviteResult>;
		};
		messages: {
			//.
			get(
				args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIChannelMessagesQuery>,
			): Promise<RESTGetAPIChannelMessagesResult>;
			//.
			post(
				args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIChannelMessageJSONBody>,
			): Promise<RESTPostAPIChannelMessageResult>;
			'bulk-delete': {
				//.
				post(
					args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIChannelMessagesBulkDeleteJSONBody>,
				): Promise<RESTPostAPIChannelMessagesBulkDeleteResult>;
			};
			(
				id: string,
			): {
				//.
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIChannelMessageResult>;
				//.
				patch(
					args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIChannelMessageJSONBody>,
				): Promise<RESTPatchAPIChannelMessageResult>;
				//.
				delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIChannelMessageResult>;
				threads: {
					//.
					post(
						args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIChannelMessagesThreadsJSONBody>,
					): Promise<RESTPostAPIChannelMessagesThreadsResult>;
				};
				crosspost: {
					//.
					post(args: RestArguments<ProxyRequestMethod.Post>): Promise<RESTPostAPIChannelMessageCrosspostResult>;
				};
				reactions: {
					//.
					delete(
						args?: RestArguments<ProxyRequestMethod.Delete>,
					): Promise<RESTDeleteAPIChannelAllMessageReactionsResult>;
					(
						emoji: string,
					): {
						//.
						get(
							args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIChannelMessageReactionUsersQuery>,
						): Promise<RESTGetAPIChannelMessageReactionUsersResult>;
						//.
						delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIChannelMessageReactionResult>;
						(
							id: '@me',
						): {
							//.
							put(args?: RestArguments<ProxyRequestMethod.Put>): Promise<RESTPutAPIChannelMessageReactionResult>;
							//.
							delete(
								args?: RestArguments<ProxyRequestMethod.Delete>,
							): Promise<RESTDeleteAPIChannelMessageReactionResult>;
						};
						(
							id: string,
						): {
							//.
							delete(
								args?: RestArguments<ProxyRequestMethod.Delete>,
							): Promise<RESTDeleteAPIChannelMessageReactionResult>;
						};
					};
				};
			};
		};
		typing: {
			//.
			post(args?: RestArguments<ProxyRequestMethod.Post>): Promise<RESTPostAPIChannelTypingResult>;
		};
		webhooks: {
			//.
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildWebhooksResult>;
			//.
			post(
				args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIChannelWebhookJSONBody>,
			): Promise<RESTPostAPIChannelWebhookResult>;
		};
	};
}
