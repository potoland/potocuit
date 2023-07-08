
import type { APIPartialEmoji } from '@biscuitland/common';
import { FormattingPatterns } from '@biscuitland/common';

// TODO: better function with tests
export function resolveEmoji(emoji: string | Record<string, any>): APIPartialEmoji | null {
	if (typeof emoji === 'string') {
		if (emoji.includes('%')) { emoji = encodeURIComponent(emoji); }
		if (!emoji.includes(':')) { return { name: emoji, id: null }; }
		const match = emoji.match(FormattingPatterns.AnimatedEmoji);
		return match && { animated: !!match[1], name: match[2], id: match[3] };
	}

	const { id, name, animated } = emoji;
	if (!(id && name)) { return null; }
	return { id, name, animated: !!animated };
}
