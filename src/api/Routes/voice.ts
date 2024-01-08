import type { RESTGetAPIVoiceRegionsResult } from '../../common';
import type { RestArguments } from '../REST';
import type { ProxyRequestMethod } from '../Router';

export interface VoiceRoutes {
	voice: {
		region: {
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIVoiceRegionsResult>;
		};
	};
}
