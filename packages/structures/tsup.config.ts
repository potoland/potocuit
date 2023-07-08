import { defineConfig } from 'tsup';
import pkg from './package.json';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
	clean: true,
	dts: true,
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	minify: isProduction,
	sourcemap: false,
	external: [...Object.keys(pkg.dependencies || {})]
});
