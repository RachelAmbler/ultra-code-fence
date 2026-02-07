/**
 * Ultra Code Fence - Patterns and Constants
 *
 * Magic strings, regex patterns, and other constants used throughout
 * the plugin. Centralising these makes them easier to maintain and
 * reduces the risk of typos.
 */

// =============================================================================
// Path Prefixes
// =============================================================================

/**
 * Prefix for vault-relative paths.
 */
export const VAULT_PREFIX = 'vault://';

/**
 * Prefix for secure remote URLs.
 */
export const HTTPS_PREFIX = 'https://';

/**
 * Prefix for insecure remote URLs.
 */
export const HTTP_PREFIX = 'http://';

// =============================================================================
// Block Separators
// =============================================================================

/**
 * Separator between YAML config and inline code (with newlines).
 */
export const INLINE_CODE_SEPARATOR = '\n~~~\n';

/**
 * Separator at end of block (without trailing newline).
 */
export const INLINE_CODE_SEPARATOR_END = '\n~~~';

// =============================================================================
// CSS Classes
// =============================================================================

/**
 * CSS class prefix for all plugin elements.
 */
export const CSS_PREFIX = 'ucf';

/**
 * Common CSS classes used throughout the plugin.
 */
export const CSS_CLASSES = {
	// Container classes
	container: 'ucf',
	codeBlock: 'ucf-code',
	cmdout: 'ucf-cmdout',
	cmdoutPre: 'ucf-cmdout-pre',

	// Title classes
	title: 'ucf-title',
	titleLeft: 'ucf-left',
	titleMeta: 'ucf-meta',
	titleText: 'ucf-text',

	// Icon classes
	icon: 'ucf-icon',
	iconSvg: 'ucf-icon-svg',
	iconOutline: 'ucf-icon-outline',
	iconText: 'ucf-icon-text',
	iconCustom: 'ucf-icon-custom',
	iconImg: 'ucf-icon-img',

	// Feature classes
	linkIndicator: 'ucf-link-indicator',
	copyButton: 'ucf-copy-button',
	copied: 'ucf-copied',
	downloadButton: 'ucf-download-button',
	foldBar: 'ucf-fold-bar',
	foldButton: 'ucf-fold-button',
	folded: 'ucf-folded',

	// Line formatting
	line: 'ucf-line',
	lineAlt: 'ucf-line-alt',
	lineNum: 'ucf-line-num',
	lineContent: 'ucf-line-content',
	lineNumbers: 'ucf-line-numbers',
	zebra: 'ucf-zebra',

	// Scrolling
	scrollable: 'ucf-scrollable',
	scrollIndicator: 'ucf-scroll-indicator',
	hidden: 'ucf-hidden',

	// Description
	description: 'ucf-description',
	descItalic: 'ucf-desc-italic',
	tooltipContainer: 'ucf-tooltip-container',
	tooltipContent: 'ucf-tooltip-content',
	hasTooltip: 'has-tooltip',

	// Command output
	cmdoutLine: 'ucf-cmdout-line',
	cmdoutCmdLine: 'ucf-cmdout-cmdline',
	cmdoutPrompt: 'ucf-cmdout-prompt',
	cmdoutCommand: 'ucf-cmdout-command',
	cmdoutOutput: 'ucf-cmdout-output',

	// Settings
	settings: 'ucf-settings',
	tabs: 'ucf-tabs',
	tab: 'ucf-tab',
	tabActive: 'ucf-tab-active',
	tabContent: 'ucf-tab-content',
	tabIntro: 'ucf-tab-intro',
	divider: 'ucf-divider',
	sectionHeader: 'ucf-section-header',
	sectionDesc: 'ucf-section-desc',

	// What's New
	whatsNewModal: 'ucf-whats-new-modal',
	whatsNewBox: 'ucf-whats-new-box',
	versionInfo: 'ucf-version-info',
	introText: 'ucf-intro-text',
	changelogSection: 'ucf-changelog-section',
	changelogNew: 'ucf-changelog-new',
	changelogFixed: 'ucf-changelog-fixed',
	highlight: 'ucf-highlight',
	credits: 'ucf-credits',
	modalButtons: 'ucf-modal-buttons',
} as const;

// =============================================================================
// Style Modifiers
// =============================================================================

/**
 * Generates a style class (e.g., "style-tab", "style-infobar").
 */
export function styleClass(style: string): string {
	return `style-${style}`;
}

// =============================================================================
// Default Values
// =============================================================================

/**
 * Line height multiplier for calculating scroll heights.
 */
export const LINE_HEIGHT_MULTIPLIER = 1.4;

/**
 * Tolerance in pixels for "at bottom" scroll detection.
 */
export const SCROLL_BOTTOM_TOLERANCE = 5;

/**
 * Delay in milliseconds before showing What's New modal.
 */
export const WHATS_NEW_DELAY_MS = 1000;

/**
 * Duration in milliseconds for copy button success state.
 */
export const COPY_SUCCESS_DURATION_MS = 2000;

// =============================================================================
// YAML Section Names (Nested Structure)
// =============================================================================

/**
 * Top-level YAML section names for nested configuration.
 */
export const YAML_SECTIONS = {
	meta: 'META',
	render: 'RENDER',
	filter: 'FILTER',
} as const;

/**
 * META section property names.
 */
export const YAML_META = {
	path: 'PATH',
	title: 'TITLE',
	desc: 'DESC',
} as const;

/**
 * RENDER section property names (for ufence blocks).
 */
export const YAML_RENDER_DISPLAY = {
	fold: 'FOLD',
	scroll: 'SCROLL',
	zebra: 'ZEBRA',
	lines: 'LINES',
	copy: 'COPY',
	style: 'STYLE',
	lang: 'LANG',
	shiftCopyJoin: 'SHIFT_COPY_JOIN',
	altCopyJoin: 'ALT_COPY_JOIN',
	cmdCopyJoin: 'CMD_COPY_JOIN',
	joinIgnoreRegex: 'JOIN_IGNORE_REGEX',
} as const;

/**
 * FILTER section property names.
 */
export const YAML_FILTER = {
	byLines: 'BY_LINES',
	byMarks: 'BY_MARKS',
} as const;

/**
 * FILTER.BY_LINES property names.
 */
export const YAML_FILTER_BY_LINES = {
	range: 'RANGE',
	inclusive: 'INCLUSIVE',
} as const;

/**
 * FILTER.BY_MARKS property names.
 */
export const YAML_FILTER_BY_MARKS = {
	start: 'START',
	end: 'END',
	inclusive: 'INCLUSIVE',
} as const;

/**
 * RENDER section property names (for cmdout blocks - PROMPT/COMMAND/OUTPUT styling).
 */
export const YAML_RENDER_CMDOUT = {
	prompt: 'PROMPT',
	command: 'COMMAND',
	output: 'OUTPUT',
} as const;

/**
 * Text style property names (used within RENDER subsections).
 */
export const YAML_TEXT_STYLE = {
	colour: 'COLOUR',
	bold: 'BOLD',
	italic: 'ITALIC',
} as const;

/**
 * Top-level PROMPT property (for cmdout blocks).
 */
export const YAML_PROMPT = 'PROMPT';

// =============================================================================
// Supported Image Extensions
// =============================================================================

/**
 * File extensions supported for custom icons.
 */
export const ICON_IMAGE_EXTENSIONS = ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'] as const;
