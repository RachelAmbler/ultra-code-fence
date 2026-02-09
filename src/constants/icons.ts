/**
 * Ultra Code Fence - Icon Data
 *
 * Mappings between programming languages/file extensions and their
 * visual representations. Supports multiple icon styles: emoji,
 * text labels, and coloured badges.
 */

// =============================================================================
// Colour Mappings
// =============================================================================

/**
 * Badge colours keyed by language or extension.
 *
 * Colours are chosen to match common associations:
 * - Shell scripts: neutral gray
 * - JavaScript: yellow (official branding)
 * - TypeScript: blue (official branding)
 * - Python: green (commonly associated)
 * - Rust: rust/orange-brown
 */
export const ICON_COLOURS: Record<string, string> = {
	// Shell scripting - neutral gray
	bash: '#4a4a4a',
	sh: '#4a4a4a',
	shell: '#4a4a4a',
	zsh: '#4a4a4a',

	// PowerShell - Microsoft blue
	powershell: '#1d4ed8',
	ps1: '#1d4ed8',
	bat: '#4a4a4a',
	cmd: '#4a4a4a',

	// C family - blue spectrum
	c: '#2563eb',
	cpp: '#2563eb',
	h: '#2563eb',
	csharp: '#3b82f6',
	cs: '#3b82f6',

	// Web languages
	javascript: '#eab308',
	js: '#eab308',
	typescript: '#3178c6',
	ts: '#3178c6',
	html: '#f97316',
	css: '#06b6d4',
	scss: '#cf649a',
	sass: '#cf649a',

	// Data formats - slate/gray
	json: '#64748b',
	yaml: '#64748b',
	yml: '#64748b',
	xml: '#d97706',
	toml: '#64748b',

	// Query languages - purple spectrum
	sql: '#8b5cf6',
	graphql: '#e535ab',

	// Python - green
	python: '#22c55e',
	py: '#22c55e',

	// JVM languages - warm colours
	java: '#ea580c',
	kotlin: '#7f52ff',

	// Systems languages
	rust: '#b7410e',
	rs: '#b7410e',
	go: '#00add8',

	// Scripting languages
	ruby: '#dc2626',
	rb: '#dc2626',
	php: '#7c3aed',
	swift: '#f05138',

	// Infrastructure
	dockerfile: '#0ea5e9',
	docker: '#0ea5e9',
	makefile: '#6b7280',
	cmake: '#6b7280',
	nginx: '#009639',
	apache: '#d22128',

	// Documentation
	markdown: '#475569',
	md: '#475569',
	txt: '#6b7280',
};

/**
 * Default colour used when no specific mapping exists.
 */
export const DEFAULT_ICON_COLOUR = '#6b7280';

// =============================================================================
// Text Label Mappings
// =============================================================================

/**
 * Short text labels for the text and badge icon styles.
 *
 * Labels are kept to 2-5 characters for readability in small spaces.
 * Common abbreviations are used where applicable.
 */
export const ICON_LABELS: Record<string, string> = {
	// Shell
	bash: 'SH',
	sh: 'SH',
	shell: 'SH',
	zsh: 'ZSH',

	// Windows scripting
	powershell: 'PS',
	ps1: 'PS',
	bat: 'BAT',
	cmd: 'CMD',

	// Web
	javascript: 'JS',
	js: 'JS',
	typescript: 'TS',
	ts: 'TS',
	html: 'HTML',
	css: 'CSS',
	scss: 'SCSS',
	sass: 'SASS',

	// Data
	json: 'JSON',
	yaml: 'YAML',
	yml: 'YML',
	xml: 'XML',
	toml: 'TOML',

	// Query
	sql: 'SQL',
	graphql: 'GQL',

	// Languages
	python: 'PY',
	py: 'PY',
	java: 'JAVA',
	kotlin: 'KT',
	c: 'C',
	cpp: 'C++',
	h: 'H',
	rust: 'RS',
	rs: 'RS',
	go: 'GO',
	ruby: 'RB',
	rb: 'RB',
	php: 'PHP',
	swift: 'SWIFT',
	csharp: 'C#',
	cs: 'C#',

	// Infrastructure
	dockerfile: 'DOCKER',
	docker: 'DOCKER',
	makefile: 'MAKE',
	cmake: 'CMAKE',
	nginx: 'NGINX',
	apache: 'APACHE',

	// Documentation
	markdown: 'MD',
	md: 'MD',
	txt: 'TXT',
};

/**
 * Default label used when no specific mapping exists.
 */
export const DEFAULT_ICON_LABEL = 'FILE';

// =============================================================================
// Emoji Mappings
// =============================================================================

/**
 * Emoji icons for the emoji icon style.
 *
 * Emojis are chosen to be visually distinctive and commonly associated
 * with the language or file type. Some are based on mascots (Python snake,
 * Go gopher, Rust crab), others on concepts (database, settings, document).
 */
export const ICON_EMOJIS: Record<string, string> = {
	// Shell - scroll for scripts
	bash: '📜',
	sh: '📜',
	shell: '📜',
	zsh: '📜',
	powershell: '📜',
	ps1: '📜',
	bat: '📜',
	cmd: '📜',

	// Web - brand-inspired colours
	javascript: '🟨',
	js: '🟨',
	typescript: '🔷',
	ts: '🔷',
	html: '🌐',
	css: '🎨',
	scss: '🎨',
	sass: '🎨',

	// Data - clipboard/list
	json: '📋',
	yaml: '📋',
	yml: '📋',
	xml: '📋',
	toml: '📋',

	// Database
	sql: '🗃️',
	graphql: '🗃️',

	// Language mascots and associations
	python: '🐍',
	py: '🐍',
	java: '☕',
	kotlin: '☕',
	c: '⚙️',
	cpp: '⚙️',
	h: '⚙️',
	rust: '🦀',
	rs: '🦀',
	go: '🐹',
	ruby: '💎',
	rb: '💎',
	php: '🐘',
	swift: '🍎',
	csharp: '🟪',
	cs: '🟪',

	// Infrastructure
	dockerfile: '🐳',
	docker: '🐳',
	makefile: '🔧',
	cmake: '🔧',
	nginx: '⚡',
	apache: '⚡',

	// Documentation
	markdown: '📝',
	md: '📝',
	txt: '📄',
};

/**
 * Default emoji used when no specific mapping exists.
 */
export const DEFAULT_ICON_EMOJI = '📄';

/**
 * Icon used for command output title bars.
 */
export const COMMAND_OUTPUT_ICON = '💻';

// =============================================================================
// Lookup Functions
// =============================================================================

/**
 * Retrieves the colour for a given language or extension.
 *
 * @param key - Language name or file extension (case-insensitive)
 * @returns Hex colour string
 */
export function getIconColour(key: string | undefined): string {
	if (!key) return DEFAULT_ICON_COLOUR;
	return ICON_COLOURS[key.toLowerCase()] ?? DEFAULT_ICON_COLOUR;
}

/**
 * Retrieves the text label for a given language or extension.
 *
 * @param key - Language name or file extension (case-insensitive)
 * @param fallback - Fallback value if no mapping exists
 * @returns Short text label
 */
export function getIconLabel(key: string | undefined, fallback?: string): string {
	if (!key) return fallback?.toUpperCase() ?? DEFAULT_ICON_LABEL;
	return ICON_LABELS[key.toLowerCase()] ?? fallback?.toUpperCase() ?? DEFAULT_ICON_LABEL;
}

/**
 * Retrieves the emoji for a given language or extension.
 *
 * @param key - Language name or file extension (case-insensitive)
 * @returns Emoji character
 */
export function getIconEmoji(key: string | undefined): string {
	if (!key) return DEFAULT_ICON_EMOJI;
	return ICON_EMOJIS[key.toLowerCase()] ?? DEFAULT_ICON_EMOJI;
}
