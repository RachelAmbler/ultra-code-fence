/**
 * Ultra Code Fence - Type Definitions
 *
 * Central type definitions for the plugin. All interfaces, types, and
 * type aliases are defined here to ensure consistency across modules.
 */

// =============================================================================
// Plugin Settings
// =============================================================================

/**
 * Visual style for the title bar above code blocks.
 *
 * - tab: Appears as a file tab sitting on top of the code block
 * - integrated: Blends into the code block with a subtle separator
 * - minimal: Small, understated filename label
 * - infobar: Full-width bar with icon on left and metadata on right
 * - none: No title bar displayed
 */
export type TitleBarStyle = 'tab' | 'integrated' | 'minimal' | 'infobar' | 'none';

/**
 * Style for file type icons shown in the title bar.
 *
 * - emoji: Language-specific emoji (e.g., 🐍 for Python)
 * - text: Short text labels (e.g., "PY" for Python)
 * - filled: Coloured rectangular badges with white text
 * - outline: Theme-aware outlined badges
 * - custom: User-provided icons from a vault folder
 * - none: No icon displayed
 */
export type FileIconStyle = 'emoji' | 'text' | 'filled' | 'outline' | 'custom' | 'none';

/**
 * How to display the optional description text.
 *
 * - below: Shows as a subtle block beneath the title
 * - tooltip: Appears on hover over the title
 * - none: Description is hidden
 */
export type DescriptionDisplayMode = 'below' | 'tooltip' | 'none';

/**
 * Complete plugin settings interface.
 *
 * Settings are persisted to data.json and can be modified via the settings tab.
 * Individual settings can be overridden per-block using YAML properties.
 */
export interface PluginSettings {
	/** Comma-separated list of languages to register processors for */
	supportedLanguages: string;

	/** Background colour for title bar (when not using theme colours) */
	titleBarBackgroundColour: string;

	/** Text colour for title bar (when not using theme colours) */
	titleBarTextColour: string;

	/** Default visual style for title bars */
	defaultTitleBarStyle: TitleBarStyle;

	/** Whether to show file type icons */
	showFileIcon: boolean;

	/** Style of file type icons */
	fileIconStyle: FileIconStyle;

	/** Vault folder containing custom icon files */
	customIconFolder: string;

	/** Show ↗ indicator on clickable titles */
	showLinkIndicator: boolean;

	/** Show copy-to-clipboard button */
	showCopyButton: boolean;

	/**
	 * Default fold line count. 0 = folding disabled, 1+ = enabled showing N lines.
	 * When FOLD is specified in YAML, it overrides this value.
	 * FOLD takes precedence over SCROLL if both are non-zero.
	 */
	foldLines: number;

	/**
	 * Default scroll line count. 0 = scrolling disabled, 1+ = enabled with max N lines.
	 * When SCROLL is specified in YAML, it overrides this value.
	 * Ignored if FOLD is active (FOLD takes precedence).
	 */
	scrollLines: number;

	/** Use Obsidian theme colours instead of custom */
	useThemeColours: boolean;

	/** Template string for generating titles (supports variables like {filename}) */
	defaultTitleTemplate: string;

	/** Show line numbers in code blocks */
	showLineNumbers: boolean;

	/** Alternate row highlighting (zebra stripes) */
	showZebraStripes: boolean;

	/** Default prefix for file paths */
	defaultPathPrefix: string;

	/** Last plugin version seen (for What's New modal) */
	lastSeenVersion: string;

	/** How to display description text */
	descriptionDisplayMode: DescriptionDisplayMode;

	/** Custom colour for description text */
	descriptionColour: string;

	/** Whether to italicise description text */
	descriptionItalic: boolean;

	/** Enable the generic ufence-code processor */
	enableGenericProcessor: boolean;

	/** Default language for ufence-code blocks without LANG property */
	defaultLanguage: string;

	/** Colour for command prompt text in cmdout blocks */
	commandPromptColour: string;

	/** Bold formatting for command prompt */
	commandPromptBold: boolean;

	/** Italic formatting for command prompt */
	commandPromptItalic: boolean;

	/** Colour for command text in cmdout blocks */
	commandTextColour: string;

	/** Bold formatting for command text */
	commandTextBold: boolean;

	/** Italic formatting for command text */
	commandTextItalic: boolean;

	/** Colour for output text in cmdout blocks */
	outputTextColour: string;

	/** Bold formatting for output text */
	outputTextBold: boolean;

	/** Italic formatting for output text */
	outputTextItalic: boolean;

	/** Per-language copy join operators keyed by language ID */
	languageCopyJoinDefaults: Record<string, { shiftJoin: string; altJoin: string; joinIgnoreRegex: string }>;

	/** Show download button on code blocks */
	showDownloadButton: boolean;

	/** Last-used download directory per note path */
	downloadPathHistory: Record<string, string>;

	/**
	 * Default print behaviour for folded/scrolled code blocks.
	 * - 'expand': Remove fold/scroll constraints when printing (show full code)
	 * - 'asis': Print as currently displayed (folded/scrolled state preserved)
	 */
	printBehaviour: string;
}

// =============================================================================
// File Metadata
// =============================================================================

/**
 * Metadata extracted from a source file path.
 *
 * Used for template variable substitution in titles and for displaying
 * file information in the infobar style.
 */
export interface SourceFileMetadata {
	/** Full filename with extension (e.g., "script.sh") */
	filename: string;

	/** Filename without extension (e.g., "script") */
	basename: string;

	/** File extension without dot (e.g., "sh") */
	extension: string;

	/** Full vault path or URL */
	fullPath: string;

	/** Parent folder path */
	parentFolder: string;

	/** Last modified timestamp in milliseconds */
	modifiedTime?: number;

	/** Creation timestamp in milliseconds */
	createdTime?: number;

	/** File size in bytes */
	sizeInBytes?: number;
}

// =============================================================================
// Block Configuration
// =============================================================================

/**
 * Parsed configuration from a ufence code block.
 *
 * This represents the combined result of parsing YAML frontmatter
 * and extracting inline code from a ufence block.
 */
export interface ParsedBlockContent {
	/** Parsed YAML properties as key-value pairs */
	yamlProperties: Record<string, unknown>;

	/** Inline code content (if using ~~~ separator) */
	embeddedCode: string | null;

	/** Whether this block contains inline code rather than a file reference */
	hasEmbeddedCode: boolean;
}

/**
 * Resolved display options for rendering a code block.
 *
 * These are the final computed values after merging block-level
 * overrides with plugin settings.
 */
export interface ResolvedDisplayOptions {
	/** Title text to display */
	titleText: string;

	/** Path to source file (for click-to-open functionality) */
	clickablePath?: string;

	/** Title bar style */
	titleBarStyle: TitleBarStyle;

	/** File metadata for templates and infobar */
	fileMetadata?: SourceFileMetadata;

	/** Programming language for syntax highlighting */
	language?: string;

	/** Description text (supports markdown) */
	descriptionText?: string;

	/** Path of the note containing this block (for resolving wiki links) */
	containingNotePath?: string;

	/** Whether to show copy button */
	showCopyButton: boolean;

	/** Whether to enable folding */
	enableFolding: boolean;

	/** Total line count in the code */
	totalLineCount: number;

	/** Custom number of lines when folded */
	visibleLinesWhenFolded?: number;

	/** Whether to show line numbers */
	showLineNumbers: boolean;

	/** Whether to show zebra stripes */
	showZebraStripes: boolean;

	/** Whether to enable scrolling */
	enableScrolling: boolean;

	/** Maximum lines before scrolling */
	maxVisibleLines: number;
}

// =============================================================================
// Title Rendering
// =============================================================================

/**
 * Options for creating a title bar element.
 *
 * Simplified interface for the title renderer, containing only
 * the information needed to build the DOM structure.
 */
export interface TitleBarOptions {
	/** Title text to display */
	titleText: string;

	/** Path for click-to-open (omit for non-clickable titles) */
	clickablePath?: string;

	/** Title bar style */
	style: TitleBarStyle;

	/** File metadata (required for infobar style) */
	fileMetadata?: SourceFileMetadata;

	/** Language (for icon selection) */
	language?: string;

	/** Description text */
	descriptionText?: string;

	/** Note path for resolving links in description */
	containingNotePath?: string;

	/** Whether to show the link indicator arrow */
	showLinkIndicator: boolean;
}

// =============================================================================
// What's New Modal
// =============================================================================

/**
 * Single item in the changelog.
 *
 * Matches the structure in whatsnew.json for feature/fix entries.
 */
export interface ChangelogItem {
	/** Feature or fix name (displayed in bold) */
	highlight: string;

	/** Description of the change */
	text: string;

	/** Related GitHub issue numbers (optional) */
	issues?: number[];
}

/**
 * Complete What's New modal data structure.
 *
 * Loaded from whatsnew.json to display release notes.
 * Property names match the JSON file structure.
 */
export interface ReleaseNotesData {
	/** Repository URL (e.g., GitHub or Codeberg) */
	repo: string;

	/** Version number string */
	version: string;

	/** Modal title text */
	title: string;

	/** Subtitle text (typically the release date) */
	subtitle: string;

	/** Introductory description paragraph */
	description: string;

	/** List of new features */
	new: ChangelogItem[];

	/** List of bug fixes */
	fixed: ChangelogItem[];
}

// =============================================================================
// Formatting Options
// =============================================================================

/**
 * Case transformation options for template variables.
 */
export type TextCaseFormat = 'upper' | 'lower' | 'title' | 'capitalise';

/**
 * Size display format options.
 */
export type FileSizeFormat = 'auto' | 'bytes' | 'kb' | 'mb' | 'gb';

/**
 * Date display format options.
 */
export type DateDisplayFormat = 'short' | 'long' | 'iso' | 'date' | 'time' | 'relative';

// =============================================================================
// Command Output
// =============================================================================

/**
 * Styling options for command output blocks.
 */
export interface CommandOutputStyles {
	/** Prompt text colour */
	promptColour: string;

	/** Prompt bold formatting */
	promptBold: boolean;

	/** Prompt italic formatting */
	promptItalic: boolean;

	/** Command text colour */
	commandColour: string;

	/** Command bold formatting */
	commandBold: boolean;

	/** Command italic formatting */
	commandItalic: boolean;

	/** Output text colour */
	outputColour: string;

	/** Output bold formatting */
	outputBold: boolean;

	/** Output italic formatting */
	outputItalic: boolean;
}

// =============================================================================
// Source Loading
// =============================================================================

/**
 * Result of attempting to load source code from a file or URL.
 */
export interface SourceLoadResult {
	/** Whether the load operation succeeded */
	succeeded: boolean;

	/** The loaded source code (empty string on failure) */
	sourceCode: string;

	/** File metadata (if available) */
	fileMetadata: SourceFileMetadata | null;

	/** Error message (if load failed) */
	errorMessage?: string;
}

/**
 * Type of source for a code block.
 */
export type SourceLocationType = 'vault' | 'remote' | 'embedded' | 'invalid';

// =============================================================================
// Nested YAML Configuration
// =============================================================================

/**
 * META section - Source file and metadata configuration.
 *
 * Used to specify the source file path and override title/description.
 */
export interface YamlMetaConfig {
	/** Source file path (vault:// or https://) - required for file embedding */
	PATH?: string;

	/** Dynamic title with template variable support (e.g., "{filename} - {size:bytes}") */
	TITLE?: string;

	/** Description text shown below title or as tooltip */
	DESC?: string;
}

/**
 * RENDER section - Visual presentation options.
 *
 * Controls how the code block is rendered (folding, scrolling, line numbers, etc.).
 */
export interface YamlRenderDisplayConfig {
	/** Fold lines: 0 = disabled, 1+ = fold to N lines. Takes precedence over SCROLL. */
	FOLD?: number;

	/** Scroll lines: 0 = disabled, 1+ = scroll after N lines. Ignored if FOLD is active. */
	SCROLL?: number;

	/** Enable zebra striping (alternating line backgrounds) */
	ZEBRA?: boolean;

	/** Show line numbers */
	LINES?: boolean;

	/** Show copy button */
	COPY?: boolean;

	/** Title bar style override */
	STYLE?: string;

	/** Syntax highlighting language override */
	LANG?: string;

	/** Join operator for Shift+click copy (e.g., "&&") */
	SHIFT_COPY_JOIN?: string;

	/** Join operator for Alt/Cmd+click copy (e.g., ";") */
	ALT_COPY_JOIN?: string;

	/** Regex pattern matching lines to ignore during joined copies */
	JOIN_IGNORE_REGEX?: string;

	/** Print behaviour override: 'expand' or 'asis' */
	PRINT?: string;
}

/**
 * BY_LINES filter configuration.
 *
 * Extracts a specific range of lines from the source.
 */
export interface YamlFilterByLines {
	/** Line range as "start, end" string or [start, end] array */
	RANGE?: string | [number, number];

	/** Include boundary lines in output (default: true) */
	INCLUSIVE?: boolean;
}

/**
 * BY_MARKS filter configuration.
 *
 * Extracts content between two marker strings in the source.
 */
export interface YamlFilterByMarks {
	/** Start marker string to search for */
	START?: string;

	/** End marker string to search for */
	END?: string;

	/** Include marker lines in output (default: true) */
	INCLUSIVE?: boolean;
}

/**
 * FILTER section - Content extraction options.
 *
 * Filters are applied in order: BY_LINES first, then BY_MARKS on the result.
 */
export interface YamlFilterConfig {
	/** Filter by line numbers */
	BY_LINES?: YamlFilterByLines;

	/** Filter by marker strings */
	BY_MARKS?: YamlFilterByMarks;
}

/**
 * Text styling options (colour, bold, italic).
 *
 * Used within RENDER section for PROMPT, COMMAND, and OUTPUT styling.
 */
export interface YamlTextStyleConfig {
	/** Text colour (CSS colour value) */
	COLOUR?: string;

	/** Bold formatting */
	BOLD?: boolean;

	/** Italic formatting */
	ITALIC?: boolean;
}

/**
 * RENDER section - Command output styling options.
 *
 * Used only by ufence-cmdout blocks to control prompt/command/output formatting.
 * Contains nested PROMPT, COMMAND, and OUTPUT subsections.
 */
export interface YamlRenderCmdoutConfig {
	/** Styling for prompt text */
	PROMPT?: YamlTextStyleConfig;

	/** Styling for command text */
	COMMAND?: YamlTextStyleConfig;

	/** Styling for output text */
	OUTPUT?: YamlTextStyleConfig;
}

// =============================================================================
// Callout Configuration
// =============================================================================

/**
 * Single callout entry in the CALLOUT section.
 *
 * Specifies what line(s) to annotate and what text to display.
 * At least one of LINE, MARK, or LINES must be provided to target code.
 */
export interface YamlCalloutEntry {
	/** Single line number to target (1-based) */
	LINE?: number;

	/** Marker string to search for in the code (first match) */
	MARK?: string;

	/** Line range as "start, end" string or [start, end] array */
	LINES?: string | [number, number];

	/** The annotation text to display */
	TEXT?: string;

	/** Whether to replace the marker line (default: false = keep alongside) */
	REPLACE?: boolean;

	/** Display mode override for this specific entry: inline | footnote | popover */
	DISPLAY?: string;

	/** Callout type for styling: note, info, warning, danger, etc. Defaults to "note" */
	TYPE?: string;
}

/**
 * CALLOUT section - Inline code annotations.
 *
 * Allows marking specific lines with explanatory notes rendered as
 * inline callouts, footnotes, or popovers.
 */
export interface YamlCalloutConfig {
	/** Default display mode for all entries: inline | footnote | popover */
	DISPLAY?: string;

	/** Print display mode (print-only override): inline | footnote */
	PRINT_DISPLAY?: string;

	/** Visual style for inline callouts: standard (left border) | border (rounded outline) */
	STYLE?: string;

	/** Array of callout entries to apply to the code block */
	ENTRIES?: YamlCalloutEntry[];
}

/**
 * Resolved callout entry with computed target line numbers.
 *
 * After resolution, all targeting (LINE, MARK, LINES) has been
 * converted to concrete line numbers.
 */
export interface ResolvedCalloutEntry {
	/** Whether this entry is enabled (has valid target lines) */
	enabled: boolean;

	/** Target line numbers (1-based, may contain multiple lines for ranges) */
	targetLines: number[];

	/** The annotation text */
	text: string;

	/** Whether to replace the marker line with callout text */
	replace: boolean;

	/** Display mode for this entry */
	displayMode: 'inline' | 'footnote' | 'popover';

	/** Callout type for styling (resolved, defaults to "note") */
	type: string;
}

/**
 * Resolved callout configuration with all defaults applied.
 */
export interface ResolvedCalloutConfig {
	/** Whether callouts are enabled (at least one valid entry) */
	enabled: boolean;

	/** Default display mode */
	displayMode: 'inline' | 'footnote' | 'popover';

	/** Print display mode */
	printDisplayMode: 'inline' | 'footnote';

	/** Visual style for inline callouts: standard | border */
	style: 'standard' | 'border';

	/** Resolved callout entries */
	entries: ResolvedCalloutEntry[];
}

/**
 * Complete parsed YAML configuration from a ufence block.
 *
 * This is the raw parsed structure before defaults are applied.
 */
export interface ParsedYamlConfig {
	META?: YamlMetaConfig;
	RENDER?: YamlRenderDisplayConfig;
	FILTER?: YamlFilterConfig;
	CALLOUT?: YamlCalloutConfig;

	/** Top-level PROMPT regex pattern (for cmdout blocks) */
	PROMPT?: string;

	/** RENDER section for cmdout styling (uses YamlRenderCmdoutConfig internally) */
	RENDER_CMDOUT?: YamlRenderCmdoutConfig;
}

/**
 * Resolved filter configuration for BY_LINES.
 */
export interface ResolvedFilterByLines {
	/** Whether this filter is enabled */
	enabled: boolean;

	/** Start line number (1-based) */
	start: number;

	/** End line number (1-based) */
	end: number;

	/** Include boundary lines */
	inclusive: boolean;
}

/**
 * Resolved filter configuration for BY_MARKS.
 */
export interface ResolvedFilterByMarks {
	/** Whether this filter is enabled */
	enabled: boolean;

	/** Start marker string */
	startMarker: string;

	/** End marker string */
	endMarker: string;

	/** Include marker lines */
	inclusive: boolean;
}

/**
 * Resolved configuration for code blocks with all defaults applied.
 *
 * This is the internal representation used during rendering.
 */
export interface ResolvedBlockConfig {
	// META section
	/** Source file path (null for embedded code) */
	sourcePath: string | null;

	/** Title template (may contain variables like {filename}) */
	titleTemplate: string;

	/** Description text */
	descriptionText: string;

	// DISPLAY section
	/** Title bar style */
	titleBarStyle: TitleBarStyle;

	/** Syntax highlighting language */
	language: string;

	/** Fold lines: 0 = disabled, 1+ = fold to N lines */
	foldLines: number;

	/** Scroll lines: 0 = disabled, 1+ = scroll after N lines */
	scrollLines: number;

	/** Show zebra stripes */
	showZebraStripes: boolean;

	/** Show line numbers */
	showLineNumbers: boolean;

	/** Show copy button */
	showCopyButton: boolean;

	/** Join operator for Shift+click copy (empty = disabled) */
	shiftCopyJoin: string;

	/** Join operator for Alt/Cmd+click copy (empty = disabled) */
	altCopyJoin: string;

	/** Regex pattern matching lines to ignore during joined copies (empty = disabled) */
	joinIgnoreRegex: string;

	// FILTER section
	/** BY_LINES filter configuration */
	filterByLines: ResolvedFilterByLines;

	/** BY_MARKS filter configuration */
	filterByMarks: ResolvedFilterByMarks;

	/** Print behaviour: 'expand' or 'asis' */
	printBehaviour: string;

	/** CALLOUT section configuration (placeholder; resolved with source code in main.ts) */
	calloutConfig: ResolvedCalloutConfig;
}

/**
 * Resolved configuration for command output blocks with all defaults applied.
 */
export interface ResolvedCmdoutConfig {
	// META section
	/** Title text */
	titleText: string | undefined;

	/** Description text */
	descriptionText: string;

	// DISPLAY section
	/** Scroll lines: 0 = disabled, 1+ = scroll after N lines */
	scrollLines: number;

	/** Show copy button */
	showCopyButton: boolean;

	// PROMPT (top-level)
	/** Prompt regex pattern */
	promptPattern: RegExp | undefined;

	// RENDER section
	/** Command output styles */
	styles: CommandOutputStyles;

	/** Print behaviour: 'expand' or 'asis' */
	printBehaviour: string;
}
