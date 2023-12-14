import { PotoClient } from './client';
import { PotoHttpClient } from './httpclient';

export * from './client';
export * from './httpclient';
export { RuntimeConfig, RuntimeConfigHTTP } from './base';

export async function initHttp() {
	const client = new PotoHttpClient();
	await client.start();
}
export async function initBot() {
	const client = new PotoClient();
	await client.start();
}
