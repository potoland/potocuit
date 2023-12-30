import { RESTDeleteAPIInviteResult, RESTGetAPIInviteQuery, RESTGetAPIInviteResult } from '../../common';
import { RestArguments } from '../REST';
import { ProxyRequestMethod } from '../Router';

export interface InviteRoutes {
	invites(id: string): {
		get(args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIInviteQuery>): Promise<RESTGetAPIInviteResult>;
		delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIInviteResult>;
	};
}
