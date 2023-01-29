import { GuildBasedResource } from './default/guild-based';
import type { DiscordStageInstance } from '@biscuitland/api-types';

export class StageInstances extends GuildBasedResource<DiscordStageInstance> {
	namespace = 'stage_instances';
}
