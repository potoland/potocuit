import type { APIDMChannel, ChannelType, ObjectToLower } from '@biscuitland/common';
import { TextBaseChannel } from './extra/TextBaseChannel';

export interface DMChannel extends TextBaseChannel, ObjectToLower<APIDMChannel> {
	fetch(): Promise<this>;
}

export class DMChannel extends TextBaseChannel {
	declare name: null;
	declare type: ChannelType.DM;
}
