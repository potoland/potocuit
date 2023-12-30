import { APIUser } from '../../common';
import { User } from '../../structures';
import { BaseResource } from './default/base';

export class Users extends BaseResource {
	namespace = 'user';

	override async get(id: string) {
		const rawUser = (await super.get(id)) as APIUser | undefined;
		return rawUser ? new User(this.client, rawUser) : undefined;
	}

	override async values() {
		const members = (await super.values()) as APIUser[];
		return members.map((rawUser) => new User(this.client, rawUser));
	}
}
