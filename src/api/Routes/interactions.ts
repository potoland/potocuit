import { RESTPostAPIInteractionCallbackJSONBody } from '../../common';
import { RestArguments } from '../REST';
import { ProxyRequestMethod } from '../Router';

export interface InteractionRoutes {
	interactions: {
		(id: string): {
			(token: string): {
				callback: {
					post(args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIInteractionCallbackJSONBody>): Promise<never>;
				};
			};
		};
	};
}
