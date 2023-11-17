import type { APIInteraction } from '@biscuitland/common';
import { InteractionResponseType, InteractionType } from '@biscuitland/common';
import type { HttpRequest, HttpResponse } from 'uWebSockets.js';
import type { StartOptions } from './base';
import { BaseClient } from './base';
import { onInteraction } from './oninteraction';
import type { DeepPartial } from '../structures/extra/types';

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
		await this.execute(options.httpConnection);
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
		const body = await this.verifySignature(res, req);
		if (!body) {
			this.debugger.debug(`Invalid request/No info, returning 418 status.`);
			// I'm a teapot
			res.writeStatus('418').end();
		} else {
			switch (body.type) {
				case InteractionType.Ping:
					this.debugger.debug(`Ping interaction received, responding.`);
					res
						// .writeStatus('200')
						.writeHeader('Content-Type', 'application/json')
						.end(JSON.stringify({ type: InteractionResponseType.Pong }));
					break;
				default:
					await onInteraction(body, this);
					break;
			}
		}
	}
}

// async findUWS(): Promise<typeof import('./_tempuwstypes.d.ts')> {
// 	const uwsNodeFile = `uws_${process.platform}_${process.arch}_${process.versions.modules}.node`;
// 	const uwsbuilddir = 'uws_build';
// 	try {
// 		const uwsDir = (await readdir(join(__dirname, uwsbuilddir)))[0]!
// 		let UWS: typeof import('./_tempuwstypes.d.ts') = require(join(__dirname, uwsbuilddir, uwsDir, uwsNodeFile))
// 		console.log(UWS)
// 		return UWS;
// 	}
// 	catch {
// 		console.log(`No ${uwsNodeFile} file detected, fetching...`);
// 		await this.downloadUWS();
// 		return this.findUWS();
// 	}
// }

// async downloadUWS() {
// 	const { zipball_url } = await fetch('https://api.github.com/repos/uNetworking/uWebSockets.js/releases')
// 		.then(response => response.json())
// 		.then(releases => releases[0] as { zipball_url: string; });
// 	const zip = await fetch(zipball_url).then(x => x.arrayBuffer());

// 	const tempzipfiledir = '__tempuws.zip';
// 	const uwsbuilddir = 'uws_build';

// 	await writeFile(join(__dirname, tempzipfiledir), new Buffer(zip));
// 	await extractZip(join(__dirname, tempzipfiledir), { dir: join(__dirname, uwsbuilddir) })

// 	const uwsDir = (await readdir(join(__dirname, uwsbuilddir)))[0]!
// 	const filesFromUWS = (await readdir(join(__dirname, uwsbuilddir, uwsDir))).filter(x => x.endsWith('.node'));

// 	let UWS: typeof import('../src/_tempuwstypes') | undefined;

// 	for (let i of filesFromUWS) {
// 		try {
// 			UWS = require(join(__dirname, uwsbuilddir, uwsDir, i));
// 		} catch {
// 			await unlink(join(__dirname, uwsbuilddir, uwsDir, i));
// 		}
// 	}

// 	await unlink(join(__dirname, tempzipfiledir))

// 	if (!UWS) throw new Error('Invalid os??')
// }

// case InteractionType.ApplicationCommandAutocomplete: {
// 	const packetData = body.data;
// 	const parentCommand = this.commandHandler.commands.find(x => x.name === packetData.name)!;
// 	const optionsResolver = new OptionResolver(this.rest, this.cache, packetData.options ?? [], parentCommand, body.data.guild_id, body.data.resolved);
// 	const interaction = new AutocompleteInteraction(this.rest, this.cache, body);
// 	const command = optionsResolver.getAutocomplete();
// 	if (command?.autocomplete) {
// 		await command.autocomplete(interaction);
// 	}
// } break;
// case InteractionType.ApplicationCommand: {
// 	switch (body.data.type) {
// 		case ApplicationCommandType.ChatInput: {
// 			const packetData = body.data;
// 			const parentCommand = this.commandHandler.commands.find(x => x.name === (packetData).name)!;
// 			const optionsResolver = new OptionResolver(this.rest, this.cache, packetData.options ?? [], parentCommand, packetData.guild_id, packetData.resolved);
// 			const interaction = BaseInteraction.from(this.rest, this.cache, body) as ChatInputCommandInteraction;
// 			const command = optionsResolver.getCommand();
// 			if (command?.run) {
// 				const context = new CommandContext(this, interaction, {}, {}, optionsResolver);
// 				const [erroredOptions, result] = await command.runOptions(context, optionsResolver);
// 				if (erroredOptions) { return await command.onRunOptionsError(context, result); }

// 				const [_, erroredMiddlewares] = await command.runMiddlewares(context);
// 				if (erroredMiddlewares) { return command.onStop(context, erroredMiddlewares); }

// 				await command.run(context);
// 			}
// 		} break;
// 	}
// } break;
