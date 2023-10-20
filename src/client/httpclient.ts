import type { GatewayInteractionCreateDispatchData } from '@biscuitland/common';
import { InteractionType, InteractionResponseType } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
import { Router } from '@biscuitland/rest';
import type { HttpResponse } from 'uWebSockets.js';
import { BaseInteraction } from '../structures/Interaction';
import type { Cache } from '../cache';

let UWS: typeof import('uWebSockets.js');
let nacl: typeof import('tweetnacl');

try {
	UWS = require('uWebSockets.js');
} catch {
	//
}

try {
	nacl = require('tweetnacl');
} catch {
	//
}

export class PotoHttpClient {
	app!: ReturnType<typeof UWS.App>;
	constructor(readonly rest: BiscuitREST, readonly cache: Cache) {
		if (!UWS) { throw new Error('No uws installed.'); }
		if (!nacl) { throw new Error('No tweetnacl installed.'); }
	}

	get proxy() {
		return new Router(this.rest).createProxy();
	}

	protected readJson(res: HttpResponse) {
		return new Promise<Record<string, any>>((cb, err) => {
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

	listen(publicKey: string, port: number) {
		this.app = UWS.App();
		this.app
			.post('/interactions', async (res, req) => {
				// TODO: check if is a valid request a that kind of stuff...
				// Create a function that look for a command (Use it in both clients)
				const timestamp = req.getHeader('x-signature-timestamp');
				const ed25519 = req.getHeader('x-signature-ed25519');
				const body = await this.readJson(res);
				if (!nacl.sign.detached.verify(
					Buffer.from(timestamp + JSON.stringify(body)),
					Buffer.from(ed25519, 'hex'),
					Buffer.from(publicKey, 'hex')
				)) {
					res.writeStatus('418').end();
				} else {
					switch (body.type) {
						case InteractionType.Ping:
							res
								// .writeStatus('200')
								.writeHeader('Content-Type', 'application/json')
								.end(JSON.stringify({ type: InteractionResponseType.Pong }));
							break;
					}
					console.log(body);
				}
			});
		this.app.listen(port, () => {
			console.log(`Listening to port ${port}`);
		});
	}

	async onPacket(packet: GatewayInteractionCreateDispatchData) {
		const interaction = BaseInteraction.from(this.rest, this.cache, packet);
		console.log(packet, interaction);
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
}
