import { filetypeinfo } from 'magic-bytes.js';
import type { BodyInit, Dispatcher, RequestInit } from 'undici-types';
import { Collection } from '../collection';
import { MergeOptions } from '../common';
import { Logger } from '../common/it/logger';
import { snowflakeToTimestamp } from '../structures/extra/functions';
import { CDN } from './CDN';
import type { ProxyRequestMethod } from './Router';
import { BurstHandler } from './handlers/BurstHandler';
import { SequentialHandler } from './handlers/SequentialHandler';
import type { IHandler } from './interfaces/Handler';
import { BurstHandlerMajorIdKey, DefaultRestOptions, DefaultUserAgent, OverwrittenMimeTypes } from './utils/constants';
import type {
	HashData,
	InternalRequest,
	RESTConstructorOptions,
	RESTOptions,
	RawFile,
	RequestData,
	RequestHeaders,
	ResponseLike,
	RouteData,
	RouteLike,
} from './utils/types';
import { RequestMethod } from './utils/types';
import { isBufferLike, parseResponse } from './utils/utils';

/**
 * Represents the class that manages handlers for endpoints
 */
export class REST {
	/**
	 * The {@link https://undici.nodejs.org/#/docs/api/Agent | Agent} for all requests
	 * performed by this manager.
	 */
	public agent: Dispatcher | null = null;

	/**
	 * The number of requests remaining in the global bucket
	 */
	public globalRemaining: number;

	/**
	 * The promise used to wait out the global rate limit
	 */
	public globalDelay: Promise<void> | null = null;

	/**
	 * The timestamp at which the global bucket resets
	 */
	public globalReset = -1;

	/**
	 * API bucket hashes that are cached from provided routes
	 */
	public readonly hashes = new Collection<string, HashData>();

	/**
	 * Request handlers created from the bucket hash and the major parameters
	 */
	public readonly handlers = new Collection<string, IHandler>();

	public readonly cdn: CDN;

	#token: string | null = null;

	private hashTimer!: NodeJS.Timeout | number;

	private handlerTimer!: NodeJS.Timeout | number;

	public readonly options: RESTOptions;

	debugger?: Logger;

	public constructor(options: RESTConstructorOptions) {
		this.options = MergeOptions(DefaultRestOptions, options);
		this.options.offset = Math.max(0, this.options.offset);
		this.globalRemaining = Math.max(1, this.options.globalRequestsPerSecond);
		this.agent = options.agent ?? null;
		this.#token = options.token;

		this.cdn = new CDN();

		if (options.debug) {
			this.debugger = new Logger({
				name: '[REST]',
			});
		}

		// Start sweepers
		this.setupSweepers();
	}

	private setupSweepers() {
		// eslint-disable-next-line unicorn/consistent-function-scoping
		const validateMaxInterval = (interval: number) => {
			if (interval > 14_400_000) {
				throw new Error('Cannot set an interval greater than 4 hours');
			}
		};

		if (this.options.hashSweepInterval !== 0 && this.options.hashSweepInterval !== Number.POSITIVE_INFINITY) {
			validateMaxInterval(this.options.hashSweepInterval);
			this.hashTimer = setInterval(() => {
				const sweptHashes = new Collection<string, HashData>();
				const currentDate = Date.now();

				// Begin sweeping hash based on lifetimes
				this.hashes.sweep((val, key) => {
					// `-1` indicates a global hash
					if (val.lastAccess === -1) return false;

					// Check if lifetime has been exceeded
					const shouldSweep = Math.floor(currentDate - val.lastAccess) > this.options.hashLifetime;

					// Add hash to collection of swept hashes
					if (shouldSweep) {
						// Add to swept hashes
						sweptHashes.set(key, val);

						// Emit debug information
						this.debugger?.info(`Hash ${val.value} for ${key} swept due to lifetime being exceeded`);
					}

					return shouldSweep;
				});

				// Fire event
				this.debugger?.info(sweptHashes);
			}, this.options.hashSweepInterval);

			this.hashTimer.unref?.();
		}

		if (this.options.handlerSweepInterval !== 0 && this.options.handlerSweepInterval !== Number.POSITIVE_INFINITY) {
			validateMaxInterval(this.options.handlerSweepInterval);
			this.handlerTimer = setInterval(() => {
				const sweptHandlers = new Collection<string, IHandler>();

				// Begin sweeping handlers based on activity
				this.handlers.sweep((val, key) => {
					// Collect inactive handlers
					if (val.inactive) {
						sweptHandlers.set(key, val);
						this.debugger?.info(`Handler ${val.id} for ${key} swept due to being inactive`);
					}

					return val.inactive;
				});

				// Fire event
				this.debugger?.info(sweptHandlers);
			}, this.options.handlerSweepInterval);

			this.handlerTimer.unref?.();
		}
	}

	/**
	 * Runs a get request from the api
	 *
	 * @param route - The full route to query
	 * @param options - Optional request options
	 */
	public async get<T>(route: string, options?: RequestObject<ProxyRequestMethod.Get>): Promise<T> {
		const data = await this.request({
			...options,
			method: RequestMethod.Get,
			fullRoute: route as `/${string}`,
			query: options?.query ? new URLSearchParams(options.query) : undefined,
		});

		return data as T;
	}

	/**
	 * Runs a delete request from the api
	 *
	 * @param route - The full route to query
	 * @param options - Optional request options
	 */
	public async delete<T>(route: string, options?: RequestObject<ProxyRequestMethod.Delete>) {
		const data = await this.request({
			...options,
			fullRoute: route as `/${string}`,
			method: RequestMethod.Delete,
			query: options?.query ? new URLSearchParams(options.query) : undefined,
		});

		return data as T;
	}

	/**
	 * Runs a post request from the api
	 *
	 * @param route - The full route to query
	 * @param options - Optional request options
	 */
	public async post<T>(route: string, body?: RequestObject<ProxyRequestMethod.Post>): Promise<T> {
		const data = await this.request({
			fullRoute: route as `/${string}`,
			method: RequestMethod.Post,
			...body,
			body: body?.body,
			query: body?.query ? new URLSearchParams(body.query) : undefined,
			files: body?.files,
		});

		return data as T;
	}

	/**
	 * Runs a put request from the api
	 *
	 * @param route - The full route to query
	 * @param options - Optional request options
	 */
	public async put<T>(route: string, body?: RequestObject<ProxyRequestMethod.Put>): Promise<T> {
		const data = await this.request({
			...body,
			body: body?.body,
			query: body?.query ? new URLSearchParams(body.query) : undefined,
			files: body?.files,
			fullRoute: route as `/${string}`,
			method: RequestMethod.Put,
		});
		return data as T;
	}

	/**
	 * Runs a patch request from the api
	 *
	 * @param route - The full route to query
	 * @param options - Optional request options
	 */
	public async patch<T>(route: string, body?: RequestObject<ProxyRequestMethod.Patch>): Promise<T> {
		const data = await this.request({
			...body,
			body: body?.body,
			query: body?.query ? new URLSearchParams(body.query) : undefined,
			files: body?.files,
			fullRoute: route as `/${string}`,
			method: RequestMethod.Patch,
		});
		return data as T;
	}

	/**
	 * Runs a request from the api
	 *
	 * @param options - Request options
	 */
	public async request(options: InternalRequest) {
		const response = await this.queueRequest(options);
		return parseResponse(response);
	}

	/**
	 * Sets the default agent to use for requests performed by this manager
	 *
	 * @param agent - The agent to use
	 */
	public setAgent(agent: Dispatcher) {
		this.agent = agent;
		return this;
	}

	/**
	 * Sets the authorization token that should be used for requests
	 *
	 * @param token - The authorization token to use
	 */
	public setToken(token: string) {
		this.#token = token;
		return this;
	}

	/**
	 * Queues a request to be sent
	 *
	 * @param request - All the information needed to make a request
	 * @returns The response from the api request
	 */
	public async queueRequest(request: InternalRequest): Promise<ResponseLike> {
		// Generalize the endpoint to its route data
		const routeId = REST.generateRouteData(request.fullRoute, request.method);
		// Get the bucket hash for the generic route, or point to a global route otherwise
		const hash = this.hashes.get(`${request.method}:${routeId.bucketRoute}`) ?? {
			value: `Global(${request.method}:${routeId.bucketRoute})`,
			lastAccess: -1,
		};

		// Get the request handler for the obtained hash, with its major parameter
		const handler =
			this.handlers.get(`${hash.value}:${routeId.majorParameter}`) ??
			this.createHandler(hash.value, routeId.majorParameter);

		// Resolve the request into usable fetch options
		const { url, fetchOptions } = await this.resolveRequest(request);

		// Queue the request
		return handler.queueRequest(routeId, url, fetchOptions, {
			body: request.body,
			files: request.files,
			auth: request.auth !== false,
			signal: request.signal,
		});
	}

	/**
	 * Creates a new rate limit handler from a hash, based on the hash and the major parameter
	 *
	 * @param hash - The hash for the route
	 * @param majorParameter - The major parameter for this handler
	 * @internal
	 */
	private createHandler(hash: string, majorParameter: string) {
		// Create the async request queue to handle requests
		const queue =
			majorParameter === BurstHandlerMajorIdKey
				? new BurstHandler(this, hash, majorParameter)
				: new SequentialHandler(this, hash, majorParameter);
		// Save the queue based on its id
		this.handlers.set(queue.id, queue);

		return queue;
	}

	/**
	 * Formats the request data to a usable format for fetch
	 *
	 * @param request - The request data
	 */
	private async resolveRequest(request: InternalRequest): Promise<{ fetchOptions: RequestInit; url: string }> {

		let query = '';

		// If a query option is passed, use it
		if (request.query) {
			const resolvedQuery = request.query.toString();
			if (resolvedQuery !== '') {
				query = `?${resolvedQuery}`;
			}
		}

		// Create the required headers
		const headers: RequestHeaders = {
			...this.options.headers,
			'User-Agent': `${DefaultUserAgent} ${this.options.userAgentAppendix}`.trim(),
		};

		// If this request requires authorization (allowing non-"authorized" requests for webhooks)
		if (request.auth !== false) {
			// If we haven't received a token, throw an error
			if (!this.#token) {
				throw new Error('Expected token to be set for this request, but none was present');
			}

			headers.Authorization = `${request.authPrefix ?? this.options.authPrefix} ${this.#token}`;
		}

		// If a reason was set, set its appropriate header
		if (request.reason?.length) {
			headers['X-Audit-Log-Reason'] = encodeURIComponent(request.reason);
		}

		// Format the full request URL (api base, optional version, endpoint, optional querystring)
		const url = `${this.options.api}${request.versioned === false ? '' : `/v${this.options.version}`}${request.fullRoute
			}${query}`;

		let finalBody: RequestInit['body'];
		let additionalHeaders: Record<string, string> = {};

		if (request.files?.length) {
			const formData = new FormData();

			// Attach all files to the request
			for (const [index, file] of request.files.entries()) {
				const fileKey = file.key ?? `files[${index}]`;

				// https://developer.mozilla.org/en-US/docs/Web/API/FormData/append#parameters
				// FormData.append only accepts a string or Blob.
				// https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob#parameters
				// The Blob constructor accepts TypedArray/ArrayBuffer, strings, and Blobs.
				if (isBufferLike(file.data)) {
					// Try to infer the content type from the buffer if one isn't passed
					let contentType = file.contentType;

					if (!contentType) {
						const [parsedType] = filetypeinfo(file.data);

						if (parsedType) {
							contentType =
								OverwrittenMimeTypes[parsedType.mime as keyof typeof OverwrittenMimeTypes] ??
								parsedType.mime ??
								'application/octet-stream';
						}
					}

					formData.append(fileKey, new Blob([file.data], { type: contentType }), file.name);
				} else {
					formData.append(fileKey, new Blob([`${file.data}`], { type: file.contentType }), file.name);
				}
			}

			// If a JSON body was added as well, attach it to the form data, using payload_json unless otherwise specified
			if (request.body != null) {
				if (request.appendToFormData) {
					for (const [key, value] of Object.entries(request.body as Record<string, unknown>)) {
						// @ts-expect-error
						formData.append(key, value);
					}
				} else {
					formData.append('payload_json', JSON.stringify(request.body));
				}
			}

			// Set the final body to the form data
			// @ts-expect-error
			finalBody = formData;

			// eslint-disable-next-line no-eq-null, eqeqeq
		} else if (request.body != null) {
			if (request.passThroughBody) {
				finalBody = request.body as BodyInit;
			} else {
				// Stringify the JSON data
				finalBody = JSON.stringify(request.body);
				// Set the additional headers to specify the content-type
				additionalHeaders = { 'Content-Type': 'application/json' };
			}
		}

		const method = request.method.toUpperCase();

		// The non null assertions in the following block are due to exactOptionalPropertyTypes, they have been tested to work with undefined
		const fetchOptions: RequestInit = {
			// Set body to null on get / head requests. This does not follow fetch spec (likely because it causes subtle bugs) but is aligned with what request was doing
			body: ['GET', 'HEAD'].includes(method) ? null : finalBody!,
			headers: { ...request.headers, ...additionalHeaders, ...headers } as Record<string, string>,
			method,
			// Prioritize setting an agent per request, use the agent for this instance otherwise.
			dispatcher: request.dispatcher ?? this.agent ?? undefined!,
		};

		return { url, fetchOptions };
	}

	/**
	 * Stops the hash sweeping interval
	 */
	public clearHashSweeper() {
		clearInterval(this.hashTimer);
	}

	/**
	 * Stops the request handler sweeping interval
	 */
	public clearHandlerSweeper() {
		clearInterval(this.handlerTimer);
	}

	/**
	 * Generates route data for an endpoint:method
	 *
	 * @param endpoint - The raw endpoint to generalize
	 * @param method - The HTTP method this endpoint is called without
	 * @internal
	 */
	private static generateRouteData(endpoint: RouteLike, method: RequestMethod): RouteData {
		if (endpoint.startsWith('/interactions/') && endpoint.endsWith('/callback')) {
			return {
				majorParameter: BurstHandlerMajorIdKey,
				bucketRoute: '/interactions/:id/:token/callback',
				original: endpoint,
			};
		}

		const majorIdMatch = /(?:^\/webhooks\/(\d{17,19}\/[^/?]+))|(?:^\/(?:channels|guilds|webhooks)\/(\d{17,19}))/.exec(
			endpoint,
		);

		// Get the major id or id + token for this route - global otherwise
		const majorId = majorIdMatch?.[2] ?? majorIdMatch?.[1] ?? 'global';

		const baseRoute = endpoint
			// Strip out all ids
			.replaceAll(/\d{17,19}/g, ':id')
			// Strip out reaction as they fall under the same bucket
			.replace(/\/reactions\/(.*)/, '/reactions/:reaction')
			// Strip out webhook tokens
			.replace(/\/webhooks\/:id\/[^/?]+/, '/webhooks/:id/:token');

		let exceptions = '';

		// Hard-Code Old Message Deletion Exception (2 week+ old messages are a different bucket)
		// https://github.com/discord/discord-api-docs/issues/1295
		if (method === RequestMethod.Delete && baseRoute === '/channels/:id/messages/:id') {
			const id = /\d{17,19}$/.exec(endpoint)![0]!;
			const timestamp = Number(snowflakeToTimestamp(id));
			if (Date.now() - timestamp > 1_000 * 60 * 60 * 24 * 14) {
				exceptions += '/Delete Old Message';
			}
		}

		return {
			majorParameter: majorId,
			bucketRoute: baseRoute + exceptions,
			original: endpoint,
		};
	}
}

export type RequestOptions = Pick<RequestData, 'passThroughBody' | 'reason' | 'auth' | 'appendToFormData'>;

export type RequestObject<
	M extends ProxyRequestMethod,
	B = Record<string, any>,
	Q = Record<string, any>,
	F extends RawFile[] = RawFile[],
> = {
	query?: Q;
} & RequestOptions &
	(M extends `${ProxyRequestMethod.Get}`
		? unknown
		: {
			body?: B;
			files?: F;
		});

export type RestArguments<
	M extends ProxyRequestMethod,
	B = any,
	Q extends never | Record<string, any> = any,
	F extends RawFile[] = RawFile[],
> = M extends ProxyRequestMethod.Get
	? Q extends never
	? RequestObject<M, never, B, never>
	: never
	: RequestObject<M, B, Q, F>;
