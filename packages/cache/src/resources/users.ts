import type { APIUser } from '@biscuitland/common';
import { BaseResource } from './default/base';

export class Users extends BaseResource<APIUser> {
	namespace = 'user';
}
