import { GuildBasedResource } from './default/guild-based';
import type { APIStageInstance } from '@biscuitland/common';

export class StageInstances extends GuildBasedResource<APIStageInstance> {
	namespace = 'stage_instances';
}
