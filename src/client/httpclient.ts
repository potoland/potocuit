import type { APIInteraction } from '@biscuitland/common';
import { InteractionResponseType, InteractionType } from '@biscuitland/common';
import type { HttpRequest, HttpResponse } from 'uWebSockets.js';
import type { StartOptions } from './base';
import { BaseClient } from './base';
import { onInteraction } from './oninteraction';
import type { DeepPartial } from '../structures/extra/types';
import FormData from 'form-data';

let UWS: typeof import('uWebSockets.js');
let nacl: typeof import('tweetnacl');

try {
	UWS = require('uWebSockets.js');
} catch {
	// easter egg #1
}

try {
	nacl = require('tweetnacl');
} catch {
	// I always cum
}

export class PotoHttpClient extends BaseClient {
	app!: ReturnType<typeof UWS.App>;
	publicKey!: string;
	publicKeyHex!: Buffer;

	constructor() {
		super();
		if (!UWS) { throw new Error('No uws installed.'); }
		if (!nacl) { throw new Error('No tweetnacl installed.'); }
	}

	protected static readJson<T extends Record<string, any>>(res: HttpResponse) {
		return new Promise<T>((cb, err) => {
			let buffer: Buffer | undefined;
			res.onData((ab, isLast) => {
				const chunk = Buffer.from(ab);
				if (isLast) {
					let json;
					try {
						json = JSON.parse(buffer ? Buffer.concat([buffer, chunk]).toString() : chunk.toString());
					} catch (e) {
						res.close();
						return;
					}
					cb(json);
				} else {
					buffer = Buffer.concat(buffer ? [buffer, chunk] : [chunk]);
				}
			});

			res.onAborted(err);
		});
	}

	async execute(options?: { publicKey?: string; port?: number }) {
		super.execute();
		const { publicKey: publicKeyRC, port: portRC, applicationId: applicationIdRC } = await this.getRC();

		const publicKey = options?.publicKey ?? publicKeyRC;
		const port = options?.port ?? portRC;

		if (!publicKey) { throw new Error('Expected a publicKey, check your .potorc.json'); }
		if (!port) { throw new Error('Expected a port, check your .potorc.json'); }
		if (applicationIdRC) { this.applicationId = applicationIdRC; }

		this.publicKey = publicKey;
		this.publicKeyHex = Buffer.from(this.publicKey, 'hex');
		this.app = UWS.App();
		this.app
			.post('/interactions', (res, req) => {
				return this.onPacket(res, req);
			});
		this.app.listen(port, () => {
			this.logger.info(`Listening to port ${port}`);
		});
	}

	async start(options: Omit<DeepPartial<StartOptions>, 'connection'> = {}) {
		await super.start(options);
		this.execute(options.httpConnection);
	}

	// https://discord.com/developers/docs/interactions/receiving-and-responding#security-and-authorization
	protected async verifySignature(res: HttpResponse, req: HttpRequest) {
		const body = await PotoHttpClient.readJson<APIInteraction>(res);
		const timestamp = req.getHeader('x-signature-timestamp');
		const ed25519 = req.getHeader('x-signature-ed25519');
		if (nacl.sign.detached.verify(
			Buffer.from(timestamp + JSON.stringify(body)),
			Buffer.from(ed25519, 'hex'),
			this.publicKeyHex
		)) { return body; }
		return;
	}

	async onPacket(res: HttpResponse, req: HttpRequest) {
		const rawBody = await this.verifySignature(res, req);
		if (!rawBody) {
			this.debugger.debug(`Invalid request/No info, returning 418 status.`);
			// I'm a teapot
			res.writeStatus('418').end();
		} else {
			switch (rawBody.type) {
				case InteractionType.Ping:
					this.debugger.debug(`Ping interaction received, responding.`);
					res
						// .writeStatus('200')
						.writeHeader('Content-Type', 'application/json')
						.end(JSON.stringify({ type: InteractionResponseType.Pong }));
					break;
				default:
					await onInteraction(rawBody, this, ({ body, files }) => {
						let response, headers: { ['Content-Type']?: string } = {};

						if (files?.length) {
							response = new FormData();
							for (const key in files) {
								const file = files[key];
								response.append(key, file.data, file);
							}
							if (body) {
								response.append('payload_json', JSON.stringify(body));
							}
							headers = Object.assign(headers, response.getHeaders());
						} else {
							response = body ?? {};
							headers['Content-Type'] = 'application/json';
						}

						for (const i in headers) {
							res.writeHeader(i, headers[i as keyof typeof headers]!);
						}

						return res.end(JSON.stringify(response));
					});
					break;
			}
		}
	}
}
