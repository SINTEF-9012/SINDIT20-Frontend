import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import {svelteTesting} from '@testing-library/svelte/vite'
import path from 'path';

export default defineConfig({
	plugins: [sveltekit(), purgeCss(), svelteTesting()],
	server: {
		host: 'localhost',
		strictPort: true,
		port: 5173
	},
	resolve: {
		alias: {
			$app: path.resolve(__dirname, 'src/$app'),
			$lib: path.resolve(__dirname, 'src/lib'),
			$apis: path.resolve(__dirname, 'src/apis')
		}
	  },
	test: {
		environment: 'jsdom',
		setupFiles: ['./vitest-setup.js'],
		coverage: {
			provider: 'v8',
			include: ['src/**/*.svelte', 'src/**/*.ts'],
			exclude: ['src/__tests__/**'],
			reporter: ['lcov', 'cobertura', "text"],
			reportsDirectory: './coverage',
		}
	},
});
