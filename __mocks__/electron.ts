/**
 * Mock for Electron module used in testing
 */

export const remote = {
	dialog: {
		async showSaveDialog(_options: {
			defaultPath: string;
			filters: Array<{ name: string; extensions: string[] }>;
		}) {
			return { canceled: true };
		},
	},
};
