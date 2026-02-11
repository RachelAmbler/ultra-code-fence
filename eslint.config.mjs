import obsidianmd from 'eslint-plugin-obsidianmd';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		files: ['src/**/*.ts'],
		extends: [
			...tseslint.configs.strictTypeChecked,
			...tseslint.configs.stylisticTypeChecked,
		],
		plugins: {
			obsidianmd,
		},
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			// Obsidian community plugin review rules
			...obsidianmd.configs.recommended,

			// Configure sentence-case with project-specific exceptions
			'obsidianmd/ui/sentence-case': ['error', {
				brands: [
					'Ultra Code Fence',
					'Embed Code File',
					'Rachel Ambler',
					'ARACS Thoughtworks',
					'Obsidian',
					'JavaScript',
					'Python',
					'Bash',
					'python',
					'bash'

				],
				acronyms: [
					'SQL', 'HTML', 'CSS', 'URL', 'OK',
				],
				enforceCamelCaseLower: true,
			}],

			// Allow _prefixed names for intentionally unused params/catches
			'@typescript-eslint/no-unused-vars': ['error', {
				argsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
			}],
		},
	},
	{
		ignores: ['node_modules/', 'main.js', 'tests/'],
	},
);
