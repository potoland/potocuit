import type { APIStageInstance } from '@biscuitland/common';
import { GuildRelatedResource } from './default/guild-related';

export class StageInstances extends GuildRelatedResource<APIStageInstance> {
	namespace = 'stage_instances';
}
