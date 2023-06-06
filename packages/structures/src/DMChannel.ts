// import type { APIDMChannel } from '@biscuitland/common';
// import type { BiscuitREST } from '@biscuitland/rest';
import { applyToClass } from '@biscuitland/common';
import { BaseChannel } from './extra/BaseChannel';
import { TextBaseChannel } from './extra/TextBaseChannel';

interface DM extends BaseChannel {
	fetch(): Promise<DMChannel>;
}

class DM extends BaseChannel {
	// constructor(rest: BiscuitREST, data: APIDMChannel) {
	// 	super(rest, data);
	// }
}

export const DMChannel = applyToClass(TextBaseChannel, DM);
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type DMChannel = InstanceType<typeof DMChannel>;
