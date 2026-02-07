import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['tests/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['src/parsers/**', 'src/utils/**', 'src/services/**', 'src/renderers/**'],
		},
	},
	resolve: {
		alias: {
			'obsidian': path.resolve(__dirname, './src/__mocks__/obsidian.ts'),
		},
	},
});
