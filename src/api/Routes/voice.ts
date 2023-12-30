import { RESTGetAPIVoiceRegionsResult } from '../../common';
import { RestArguments } from '../REST';
import { ProxyRequestMethod } from '../Router';

export interface VoiceRoutes {
	voice: {
		region: {
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIVoiceRegionsResult>;
		};
	};
}
