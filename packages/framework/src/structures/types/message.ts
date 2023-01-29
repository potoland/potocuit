import type {
	Embed
} from './embed';
import type {
	ActionRowComponent
} from './interaction';

interface AllowedMentions {
	parse?: ('roles' | 'users' | 'everyone')[];
	roles?: string[];
	users?: string[];
	replied_user?: boolean;
}

export interface CreateMessageData {
	tts?: boolean;
	content?: string;
	embeds?: Embed[];
	allowed_mentions?: AllowedMentions;
	flags?: number;
	components?: ActionRowComponent[];
	// attachments?: any[];
}
