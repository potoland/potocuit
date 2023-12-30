import { RESTGetAPIGatewayBotResult, RESTGetAPIGatewayResult } from '../../common';
import { RestArguments } from '../REST';
import { ProxyRequestMethod } from '../Router';

export interface GatewayRoutes {
	gateway: {
		get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGatewayResult>;
		bot: {
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGatewayBotResult>;
		};
	};
}
