import type { DiscordUser } from '@biscuitland/api-types';
import { BaseResource } from './default/base';

export class Users extends BaseResource<DiscordUser> {
	namespace = 'user';
}
