import { APIVersion } from 'discord-api-types/v10';
import { BASE_URL } from '../../common';

export const DefaultUserAgent =
	"DiscordBot (https://biscuitjs.com)";

export const DefaultRestOptions = {
	agent: null,
	api: BASE_URL,
	authPrefix: 'Bot',
	headers: {},
	invalidRequestWarningInterval: 0,
	globalRequestsPerSecond: 50,
	offset: 50,
	rejectOnRateLimit: null,
	retries: 3,
	timeout: 15_000,
	version: APIVersion,
	hashSweepInterval: 14_400_000, // 4 Hours
	hashLifetime: 86_400_000, // 24 Hours
	handlerSweepInterval: 3_600_000, // 1 Hour
};

/**
 * The events that the REST manager emits
 */
export enum RESTEvents {
	Debug = 'restDebug',
	HandlerSweep = 'handlerSweep',
	HashSweep = 'hashSweep',
	InvalidRequestWarning = 'invalidRequestWarning',
	RateLimited = 'rateLimited',
	Response = 'response',
}

export const ALLOWED_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg', 'gif'] as const satisfies readonly string[];
export const ALLOWED_STICKER_EXTENSIONS = ['png', 'json', 'gif'] as const satisfies readonly string[];
export const ALLOWED_SIZES = [16, 32, 64, 128, 256, 512, 1_024, 2_048, 4_096] as const satisfies readonly number[];

export type ImageExtension = (typeof ALLOWED_EXTENSIONS)[number];
export type StickerExtension = (typeof ALLOWED_STICKER_EXTENSIONS)[number];
export type ImageSize = (typeof ALLOWED_SIZES)[number];

export const OverwrittenMimeTypes = {
	// https://github.com/discordjs/discord.js/issues/8557
	'image/apng': 'image/png',
} as const satisfies Readonly<Record<string, string>>;

export const BurstHandlerMajorIdKey = 'burst';

/**
 * Prefix for deprecation warnings.
 *
 * @internal
 */
export const DEPRECATION_WARNING_PREFIX = 'DeprecationWarning' as const;
