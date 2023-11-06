import { PotoClient } from './client';
import { PotoHttpClient } from './httpclient';

export * from './client';
export * from './httpclient';

export async function initHttp() {
	const client = new PotoHttpClient();
	await client.execute();
	return Promise.allSettled([client.loadLangs(), client.loadCommands()]);
}
export async function initBot() {
	const client = new PotoClient();
	await client.execute();
	return Promise.allSettled([client.loadLangs(), client.loadCommands(), client.loadEvents()]);
}
