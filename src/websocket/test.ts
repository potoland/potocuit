import { ShardManager } from './index';
import { BiscuitREST, Router } from '@biscuitland/rest';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
// let index = 0;
async function main() {
	for (const bot of [
		{
			token: 'ODU2MzA5MTgyMTA1NjQ5MTYy.YM_KEg.oTSSvhhKXUeHk57WlArGkGJFI24',
			name: 'Zenitsu'
		},
		{
			token: 'Njk2MDQ1MjA5Nzc5NDM3NTk4.GdyDU5.CaxKU_lHwyOkk91oIgkh-h8qPe4Mqv6HFNZ2V8',
			name: 'Tohka'
		},
		{
			token: 'NjYzODEyOTgwOTUzMzE3Mzc4.GSlmqz.ZlSOckEc1o2t6ayvgppba1tlPsrCkAKk38UY0A',
			name: 'Lidee'
		},
		{
			token: 'NjkwNzEyNzI2OTM4NTgzMDUx.GEUvnH.X2j7E4eEapma26PoKDc0DMkAeLLH-OjmsuXPjM',
			name: 'Lidee beta'
		},
	]) {

		const rest = new BiscuitREST({
			token: bot.token
		});

		const info = await new Router(rest).createProxy().gateway.bot.get();
		const manager = new ShardManager({
			debug: true,
			handlePayload(_shardId, _packet) {
				//
			},
			intents: 4096,
			info,
			token: rest.options.token,
			totalShards: 16
		});
		// manager.logger.options.logLevel = 0;
		// manager.logger.options.name = `[${Logger.colorFunctions.get(index++)!(bot.name)}]`;
		manager.logger.name = bot.name;
		await mkdir(join(process.cwd(), 'logs', bot.name), { recursive: true });
		manager.spawnShards();
		// break;
	}
}

main()
	.catch(console.error);
