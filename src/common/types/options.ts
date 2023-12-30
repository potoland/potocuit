import type { Identify } from '..';
import type { ImageExtension, ImageSize, RawFile, Routes } from '../../api';
import { BaseClient } from '../../client/base';

/**
 * The options used for image URLs
 */
export interface BaseImageURLOptions {
	/**
	 * The extension to use for the image URL
	 *
	 * @defaultValue `'webp'`
	 */
	extension?: ImageExtension;
	/**
	 * The size specified in the image URL
	 */
	size?: ImageSize;
}

/**
 * The options used for image URLs with animated content
 */
export interface ImageURLOptions extends BaseImageURLOptions {
	/**
	 * Whether or not to prefer the static version of an image asset.
	 */
	forceStatic?: boolean;
}

export type ImageOptions = ImageURLOptions;

export type MethodContext<T = {}> = Identify<{ client: BaseClient; api: Routes; id: string /* resourceId*/ } & T>;

export type MessagePayload<Body, Extra = {}> = Identify<{ body: Body; files?: RawFile[] } & Extra>;
