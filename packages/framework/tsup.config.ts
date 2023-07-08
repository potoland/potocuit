import { defineConfig } from 'tsup';
import pkg from './package.json';

const isProduction = process.env.NODE_ENV === 'production';

const external = [
	...Object.keys(pkg.dependencies || {}),
	...Object.keys(pkg.devDependencies || {}),
	'discord-api-types',
	'undici',
	'@discordjs/collection',
	'@discordjs/util',
	'@discordjs/rest',
	'@biscuitland/rest',
];

export default defineConfig({
	clean: true,
	dts: true,
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	minify: isProduction,
	sourcemap: false,
	external
});
