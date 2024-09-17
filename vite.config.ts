import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit(), purgeCss()],
	server: {
		host: true,
		strictPort: true,
		port: 5173
	},
	resolve: {
		alias: {
			$app: path.resolve(__dirname, 'src/$app'),
			$lib: path.resolve(__dirname, 'src/lib'),
			$apis: path.resolve(__dirname, 'src/apis')
		}
	  }
});
