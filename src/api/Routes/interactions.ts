import type { RESTPostAPIInteractionCallbackJSONBody } from '../../common';
import type { RestArguments } from '../REST';
import type { ProxyRequestMethod } from '../Router';

export interface InteractionRoutes {
	interactions: {
		(
			id: string,
		): {
			(
				token: string,
			): {
				callback: {
					post(args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIInteractionCallbackJSONBody>): Promise<never>;
				};
			};
		};
	};
}
