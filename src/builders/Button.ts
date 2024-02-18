import { throwError } from '..';
import {
	ComponentType,
	type APIButtonComponent,
	type APIButtonComponentWithCustomId,
	type APIButtonComponentWithURL,
	type APIMessageComponentEmoji,
	type ButtonStyle,
	type EmojiResolvable,
	type When,
} from '../common';
import type { ButtonInteraction } from '../structures';
import { resolvePartialEmoji } from '../structures/extra/functions';
import type { ComponentCallback } from './types';

export type ButtonStylesForID = Exclude<ButtonStyle, ButtonStyle.Link>;

/**
 * Represents a button component.
 * @template Type - The type of the button component.
 */
export class Button<Type extends boolean = boolean> {
	/** @internal */
	__exec?: ComponentCallback<ButtonInteraction>;

	/**
	 * Creates a new Button instance.
	 * @param data - The initial data for the button.
	 */
	constructor(public data: Partial<When<Type, APIButtonComponentWithCustomId, APIButtonComponentWithURL>> = {}) {
		this.data.type = ComponentType.Button;
	}

	/**
	 * Sets the custom ID for the button.
	 * @param id - The custom ID to set.
	 * @returns The modified Button instance.
	 */
	setCustomId(id: string): Omit<this, 'setURL'> {
		// @ts-expect-error
		this.data.custom_id = id;
		return this;
	}

	/**
	 * Sets the URL for the button.
	 * @param url - The URL to set.
	 * @returns The modified Button instance.
	 */
	setURL(url: string): Omit<this, 'setCustomId' | 'run'> {
		// @ts-expect-error
		this.data.url = url;
		return this;
	}

	/**
	 * Sets the label for the button.
	 * @param label - The label to set.
	 * @returns The modified Button instance.
	 */
	setLabel(label: string) {
		this.data.label = label;
		return this;
	}

	/**
	 * Sets the emoji for the button.
	 * @param emoji - The emoji to set.
	 * @returns The modified Button instance.
	 */
	setEmoji(emoji: EmojiResolvable) {
		const resolve = resolvePartialEmoji(emoji);
		if (!resolve) return throwError('Invalid Emoji');
		this.data.emoji = resolve as APIMessageComponentEmoji;
		return this;
	}

	/**
	 * Sets the disabled state of the button.
	 * @param disabled - Whether the button should be disabled or not.
	 * @returns The modified Button instance.
	 */
	setDisabled(disabled = true) {
		this.data.disabled = disabled;
		return this;
	}

	setStyle(style: ButtonStyle.Link): Omit<this, 'setCustomId' | 'run'>;
	setStyle(style: ButtonStylesForID): Omit<this, 'setURL'>;
	setStyle(style: ButtonStyle): Omit<this, 'setURL'> | Omit<this, 'setCustomId' | 'run'> {
		this.data.style = style;
		return this;
	}

	/**
	 * Sets the callback function to be executed when the button is interacted with.
	 * @param func - The callback function to set.
	 * @returns The modified Button instance.
	 */
	run(func: ComponentCallback<ButtonInteraction>): Omit<this, 'setURL'> {
		this.__exec = func;
		return this;
	}

	/**
	 * Converts the Button instance to its JSON representation.
	 * @returns The JSON representation of the Button instance.
	 */
	toJSON() {
		return { ...this.data } as unknown as APIButtonComponent;
	}
}
