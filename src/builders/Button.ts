import { resolvePartialEmoji, throwError, type APIMessageComponentEmoji } from '..';
import {
	ComponentType,
	type APIButtonComponent,
	type APIButtonComponentWithCustomId,
	type APIButtonComponentWithURL,
	type ButtonStyle,
	type EmojiResolvable,
	type When,
} from '../common';
import type { ButtonInteraction } from '../structures';
import type { ComponentCallback } from './types';

export type ButtonStylesForID = Exclude<ButtonStyle, ButtonStyle.Link>;

export class Button<Type extends boolean = boolean> {
	/** @internal */
	__exec?: ComponentCallback<ButtonInteraction>;

	constructor(public data: Partial<When<Type, APIButtonComponentWithCustomId, APIButtonComponentWithURL>> = {}) {
		this.data.type = ComponentType.Button;
	}

	setCustomId(id: string): Omit<this, 'setURL'> {
		// @ts-expect-error
		this.data.custom_id = id;
		return this;
	}

	setURL(url: string): Omit<this, 'setCustomId'> {
		// @ts-expect-error
		this.data.url = url;
		return this;
	}

	setLabel(label: string) {
		this.data.label = label;
		return this;
	}

	setEmoji(emoji: EmojiResolvable) {
		const resolve = resolvePartialEmoji(emoji);
		if (!resolve) return throwError('Invalid Emoji');
		this.data.emoji = resolve as APIMessageComponentEmoji;
		return this;
	}

	setDisabled(disabled = true) {
		this.data.disabled = disabled;
		return this;
	}

	setStyle(style: ButtonStyle.Link): Omit<this, 'setCustomId'>;
	setStyle(style: ButtonStylesForID): Omit<this, 'setURL'>;
	setStyle(style: ButtonStyle): Omit<this, 'setURL'> | Omit<this, 'setCustomId'> {
		this.data.style = style;
		return this as any;
	}

	run(func: ComponentCallback<ButtonInteraction>): this {
		this.__exec = func;
		return this;
	}

	toJSON() {
		return { ...this.data } as unknown as APIButtonComponent;
	}
}
