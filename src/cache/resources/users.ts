import { BaseResource } from "./default/base";

export class Users extends BaseResource {
    namespace = "user";

    // override async get(id: string) {
    // 	const rawUser = await super.get(id) as APIUser | undefined;
    // 	return rawUser ? new User(this.rest, this.cache, rawUser) : undefined;
    // }

    // override async items(options?: any) {
    // 	const members = await super.items(options) as APIUser[];
    // 	return members.map(rawUser => new User(this.rest, this.cache, rawUser));
    // }
}
