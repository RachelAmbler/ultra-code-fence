/**
 * Ultra Code Fence - YAML Parser
 *
 * Handles parsing of ufence block content, including YAML configuration
 * and embedded code separation. Provides a unified interface for extracting
 * structured data from raw block content.
 */

import { parseYaml } from 'obsidian';
import type {
	ParsedBlockContent,
	ParsedYamlConfig,
	YamlMetaConfig,
	YamlRenderDisplayConfig,
	YamlFilterConfig,
	YamlCalloutConfig,
	YamlCalloutEntry,
	YamlRenderCmdoutConfig,
	YamlTextStyleConfig,
	ResolvedBlockConfig,
	ResolvedCmdoutConfig,
	ResolvedCalloutConfig,
	ResolvedCalloutEntry,
	PluginSettings,
	TitleBarStyle,
	CommandOutputStyles,
} from '../types';
import {
	INLINE_CODE_SEPARATOR_END,
	YAML_SECTIONS,
	YAML_META,
	YAML_RENDER_DISPLAY,
	YAML_FILTER,
	YAML_FILTER_BY_LINES,
	YAML_FILTER_BY_MARKS,
	YAML_RENDER_CMDOUT,
	YAML_TEXT_STYLE,
	YAML_CALLOUT,
	YAML_CALLOUT_ENTRY,
	YAML_PROMPT,
	normalizeCalloutType,
} from '../constants';

// =============================================================================
// Block Parsing
// =============================================================================

/**
 * Parses raw ufence block content into structured configuration.
 *
 * Handles two formats:
 * 1. YAML-only: The entire block is YAML configuration with a PATH property
 * 2. Embedded code: YAML followed by ~~~ separator and code content
 *
 * @param rawContent - The raw content between the code fence markers
 * @returns Parsed configuration object
 * @throws Error if YAML parsing fails
 *
 * @example
 * // File reference format:
 * // PATH: vault://Scripts/helper.ts
 * // TITLE: "Helper Functions"
 *
 * @example
 * // Embedded code format:
 * // TITLE: "Example"
 * // ~~~
 * // console.log("Hello");
 */
export function parseBlockContent(rawContent: string): ParsedBlockContent {
	const hasEmbeddedCode = rawContent.includes(INLINE_CODE_SEPARATOR_END) || rawContent.startsWith('~~~');

	if (hasEmbeddedCode) {
		return parseEmbeddedCodeBlock(rawContent);
	}

	// Try to parse as YAML — if valid and contains known sections, use it
	try {
		const yamlProperties = parseYaml(rawContent) as Record<string, unknown>;

		if (yamlProperties && typeof yamlProperties === 'object' && hasKnownYamlSections(yamlProperties)) {
			return {
				yamlProperties,
				embeddedCode: null,
				hasEmbeddedCode: false,
			};
		}
	} catch {
		// YAML parsing failed — not YAML
	}

	// No valid YAML structure found — treat entire content as plain code
	return {
		yamlProperties: {},
		embeddedCode: rawContent,
		hasEmbeddedCode: true,
	};
}

/**
 * Parses a block containing embedded code (YAML + ~~~ + code).
 *
 * @param rawContent - Raw block content with ~~~ separator
 * @returns Parsed configuration with embedded code
 */
function parseEmbeddedCodeBlock(rawContent: string): ParsedBlockContent {
	const separatorIndex = rawContent.indexOf(INLINE_CODE_SEPARATOR_END);
	const yamlPart = rawContent.substring(0, separatorIndex);

	// Code starts after the separator (skip the \n~~~)
	const codeStartIndex = separatorIndex + 4;
	let embeddedCode = rawContent.substring(codeStartIndex);

	// Remove leading newline if present
	if (embeddedCode.startsWith('\n')) {
		embeddedCode = embeddedCode.substring(1);
	}

	const yamlProperties = yamlPart.trim()
		? parseYaml(yamlPart) as Record<string, unknown>
		: {};

	return {
		yamlProperties: yamlProperties ?? {},
		embeddedCode,
		hasEmbeddedCode: true,
	};
}

/**
 * Checks whether parsed YAML contains any recognised ufence top-level sections.
 *
 * Used to distinguish genuine ufence YAML configuration from plain code that
 * happened to survive YAML parsing without throwing an error.
 *
 * @param yamlProps - Parsed YAML properties
 * @returns True if at least one known section key is present
 */
function hasKnownYamlSections(yamlProps: Record<string, unknown>): boolean {
	const knownKeys = [
		YAML_SECTIONS.meta,
		YAML_SECTIONS.render,
		YAML_SECTIONS.filter,
		YAML_SECTIONS.callout,
		YAML_PROMPT,
	];
	return knownKeys.some(key => key in yamlProps);
}

// =============================================================================
// Value Resolution
// =============================================================================

/**
 * Resolves a boolean value from YAML, handling string representations.
 *
 * YAML parsers may return booleans as actual booleans or as strings
 * depending on quoting. This function normalises both cases.
 *
 * @param yamlValue - Value from parsed YAML (may be boolean, string, or undefined)
 * @param defaultValue - Value to use if yamlValue is undefined
 * @returns Resolved boolean value
 *
 * @example
 * resolveBoolean(true, false)      // true
 * resolveBoolean('true', false)    // true
 * resolveBoolean('false', true)    // false
 * resolveBoolean(undefined, true)  // true
 */
export function resolveBoolean(yamlValue: unknown, defaultValue: boolean): boolean {
	if (yamlValue === undefined) {
		return defaultValue;
	}

	return yamlValue === true || yamlValue === 'true';
}

/**
 * Resolves a numeric value from YAML.
 *
 * @param yamlValue - Value from parsed YAML
 * @param defaultValue - Value to use if yamlValue is undefined or invalid
 * @returns Resolved numeric value
 *
 * @example
 * resolveNumber(20, 10)        // 20
 * resolveNumber('30', 10)      // 30
 * resolveNumber(undefined, 10) // 10
 * resolveNumber('abc', 10)     // 10
 */
export function resolveNumber(yamlValue: unknown, defaultValue: number): number {
	if (yamlValue === undefined) {
		return defaultValue;
	}

	const parsed = typeof yamlValue === 'number'
		? yamlValue
		: typeof yamlValue === 'string' ? parseInt(yamlValue, 10) : NaN;

	return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Resolves a string value from YAML.
 *
 * @param yamlValue - Value from parsed YAML
 * @param defaultValue - Value to use if yamlValue is undefined
 * @returns Resolved string value
 */
export function resolveString(yamlValue: unknown, defaultValue: string): string {
	if (yamlValue === undefined || yamlValue === null) {
		return defaultValue;
	}

	if (typeof yamlValue === 'string') {
		return yamlValue;
	}

	// Convert all other types using String()
	const stringValue = String(yamlValue);
	// Empty string result should use defaultValue
	return stringValue === '' ? defaultValue : stringValue;
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validates that a string is a valid regex pattern.
 *
 * @param pattern - Potential regex pattern string
 * @returns True if the pattern is valid, false otherwise
 */
export function isValidRegex(pattern: string): boolean {
	try {
		new RegExp(pattern);
		return true;
	} catch {
		return false;
	}
}

/**
 * Safely creates a RegExp from a string, returning null if invalid.
 *
 * @param pattern - Regex pattern string
 * @returns RegExp instance or null if invalid
 */
export function createSafeRegex(pattern: string): RegExp | null {
	try {
		return new RegExp(pattern);
	} catch {
		return null;
	}
}

// =============================================================================
// Nested YAML Parsing
// =============================================================================

/**
 * Safely retrieves a section object from parsed YAML.
 *
 * @param yamlProps - Parsed YAML properties
 * @param sectionName - Name of the section to retrieve
 * @returns Section object or empty object if not found/invalid
 */
function getSection(yamlProps: Record<string, unknown>, sectionName: string): Record<string, unknown> {
	const section = yamlProps[sectionName];
	if (section && typeof section === 'object' && !Array.isArray(section)) {
		return section as Record<string, unknown>;
	}
	return {};
}

/**
 * Parses the META section from YAML configuration.
 *
 * @param yamlProps - Parsed YAML properties
 * @returns META section configuration
 */
export function parseMetaSection(yamlProps: Record<string, unknown>): YamlMetaConfig {
	const meta = getSection(yamlProps, YAML_SECTIONS.meta);

	return {
		PATH: meta[YAML_META.path] !== undefined ? String(meta[YAML_META.path]) : undefined,
		TITLE: meta[YAML_META.title] !== undefined ? String(meta[YAML_META.title]) : undefined,
		DESC: meta[YAML_META.desc] !== undefined ? String(meta[YAML_META.desc]) : undefined,
		PRESET: meta[YAML_META.preset] !== undefined ? String(meta[YAML_META.preset]) : undefined,
	};
}

/**
 * Parses the RENDER section from YAML configuration (for ufence display options).
 *
 * @param yamlProps - Parsed YAML properties
 * @returns RENDER section configuration
 */
export function parseRenderDisplaySection(yamlProps: Record<string, unknown>): YamlRenderDisplayConfig {
	const render = getSection(yamlProps, YAML_SECTIONS.render);

	return {
		FOLD: render[YAML_RENDER_DISPLAY.fold] !== undefined
			? resolveNumber(render[YAML_RENDER_DISPLAY.fold], 0)
			: undefined,
		SCROLL: render[YAML_RENDER_DISPLAY.scroll] !== undefined
			? resolveNumber(render[YAML_RENDER_DISPLAY.scroll], 0)
			: undefined,
		ZEBRA: render[YAML_RENDER_DISPLAY.zebra] !== undefined
			? resolveBoolean(render[YAML_RENDER_DISPLAY.zebra], false)
			: undefined,
		LINES: render[YAML_RENDER_DISPLAY.lines] !== undefined
			? resolveBoolean(render[YAML_RENDER_DISPLAY.lines], false)
			: undefined,
		COPY: render[YAML_RENDER_DISPLAY.copy] !== undefined
			? resolveBoolean(render[YAML_RENDER_DISPLAY.copy], true)
			: undefined,
		STYLE: render[YAML_RENDER_DISPLAY.style] !== undefined
			? String(render[YAML_RENDER_DISPLAY.style]).toLowerCase()
			: undefined,
		LANG: render[YAML_RENDER_DISPLAY.lang] !== undefined
			? String(render[YAML_RENDER_DISPLAY.lang])
			: undefined,
		SHIFT_COPY_JOIN: render[YAML_RENDER_DISPLAY.shiftCopyJoin] !== undefined
			? String(render[YAML_RENDER_DISPLAY.shiftCopyJoin])
			: undefined,
		// ALT_COPY_JOIN and CMD_COPY_JOIN are synonymous
		ALT_COPY_JOIN: (render[YAML_RENDER_DISPLAY.altCopyJoin] ?? render[YAML_RENDER_DISPLAY.cmdCopyJoin]) !== undefined
			? String(render[YAML_RENDER_DISPLAY.altCopyJoin] ?? render[YAML_RENDER_DISPLAY.cmdCopyJoin])
			: undefined,
		JOIN_IGNORE_REGEX: render[YAML_RENDER_DISPLAY.joinIgnoreRegex] !== undefined
			? String(render[YAML_RENDER_DISPLAY.joinIgnoreRegex])
			: undefined,
		PRINT: render[YAML_RENDER_DISPLAY.print] !== undefined
			? String(render[YAML_RENDER_DISPLAY.print]).toLowerCase()
			: undefined,
	};
}

/**
 * Parses a line range specification.
 *
 * Accepts either:
 * - "10, 20" string format
 * - [10, 20] array format
 *
 * @param rangeValue - Range value from YAML
 * @returns Parsed [start, end] tuple or null if invalid
 */
export function parseLineRange(rangeValue: unknown): [number, number] | null {
	// Array format: [10, 20]
	if (Array.isArray(rangeValue) && rangeValue.length === 2) {
		const start = parseInt(String(rangeValue[0]), 10);
		const end = parseInt(String(rangeValue[1]), 10);
		if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
			return [start, end];
		}
	}

	// String format: "10, 20"
	if (typeof rangeValue === 'string') {
		const parts = rangeValue.split(',').map(s => parseInt(s.trim(), 10));
		if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] > 0 && parts[1] >= parts[0]) {
			return [parts[0], parts[1]];
		}
	}

	return null;
}

/**
 * Parses the FILTER section from YAML configuration.
 *
 * @param yamlProps - Parsed YAML properties
 * @returns FILTER section configuration
 */
export function parseFilterSection(yamlProps: Record<string, unknown>): YamlFilterConfig {
	const filter = getSection(yamlProps, YAML_SECTIONS.filter);
	const result: YamlFilterConfig = {};

	// Parse BY_LINES
	const byLines = filter[YAML_FILTER.byLines];
	if (byLines && typeof byLines === 'object' && !Array.isArray(byLines)) {
		const byLinesObj = byLines as Record<string, unknown>;
		result.BY_LINES = {
			RANGE: byLinesObj[YAML_FILTER_BY_LINES.range] as string | [number, number] | undefined,
			INCLUSIVE: byLinesObj[YAML_FILTER_BY_LINES.inclusive] !== undefined
				? resolveBoolean(byLinesObj[YAML_FILTER_BY_LINES.inclusive], true)
				: undefined,
		};
	}

	// Parse BY_MARKS
	const byMarks = filter[YAML_FILTER.byMarks];
	if (byMarks && typeof byMarks === 'object' && !Array.isArray(byMarks)) {
		const byMarksObj = byMarks as Record<string, unknown>;
		result.BY_MARKS = {
			START: byMarksObj[YAML_FILTER_BY_MARKS.start] !== undefined
				? String(byMarksObj[YAML_FILTER_BY_MARKS.start])
				: undefined,
			END: byMarksObj[YAML_FILTER_BY_MARKS.end] !== undefined
				? String(byMarksObj[YAML_FILTER_BY_MARKS.end])
				: undefined,
			INCLUSIVE: byMarksObj[YAML_FILTER_BY_MARKS.inclusive] !== undefined
				? resolveBoolean(byMarksObj[YAML_FILTER_BY_MARKS.inclusive], true)
				: undefined,
		};
	}

	return result;
}

/**
 * Parses the CALLOUT section from YAML configuration.
 *
 * Validates entry structure and normalises values. Each entry should have
 * TEXT and at least one targeting property (LINE, MARK, or LINES).
 *
 * @param yamlProps - Parsed YAML properties
 * @returns CALLOUT section configuration
 */
export function parseCalloutSection(yamlProps: Record<string, unknown>): YamlCalloutConfig {
	const callout = getSection(yamlProps, YAML_SECTIONS.callout);
	const result: YamlCalloutConfig = {};

	// Parse DISPLAY mode
	if (callout[YAML_CALLOUT.display] !== undefined) {
		result.DISPLAY = String(callout[YAML_CALLOUT.display]).toLowerCase();
	}

	// Parse PRINT_DISPLAY mode
	if (callout[YAML_CALLOUT.printDisplay] !== undefined) {
		result.PRINT_DISPLAY = String(callout[YAML_CALLOUT.printDisplay]).toLowerCase();
	}

	// Parse STYLE
	if (callout[YAML_CALLOUT.style] !== undefined) {
		result.STYLE = String(callout[YAML_CALLOUT.style]).toLowerCase();
	}

	// Parse ENTRIES array
	const entries = callout[YAML_CALLOUT.entries];
	if (Array.isArray(entries)) {
		result.ENTRIES = entries
			.filter(entry => entry && typeof entry === 'object' && !Array.isArray(entry))
			.map(entryObj => {
				const entry = entryObj as Record<string, unknown>;
				const parsed: YamlCalloutEntry = {};

				if (entry[YAML_CALLOUT_ENTRY.line] !== undefined) {
					parsed.LINE = resolveNumber(entry[YAML_CALLOUT_ENTRY.line], -1);
				}

				if (entry[YAML_CALLOUT_ENTRY.mark] !== undefined) {
					parsed.MARK = String(entry[YAML_CALLOUT_ENTRY.mark]);
				}

				if (entry[YAML_CALLOUT_ENTRY.lines] !== undefined) {
					parsed.LINES = entry[YAML_CALLOUT_ENTRY.lines] as string | [number, number];
				}

				if (entry[YAML_CALLOUT_ENTRY.text] !== undefined) {
					parsed.TEXT = String(entry[YAML_CALLOUT_ENTRY.text]);
				}

				if (entry[YAML_CALLOUT_ENTRY.replace] !== undefined) {
					parsed.REPLACE = resolveBoolean(entry[YAML_CALLOUT_ENTRY.replace], false);
				}

				if (entry[YAML_CALLOUT_ENTRY.display] !== undefined) {
					parsed.DISPLAY = String(entry[YAML_CALLOUT_ENTRY.display]).toLowerCase();
				}

				if (entry[YAML_CALLOUT_ENTRY.type] !== undefined) {
					parsed.TYPE = String(entry[YAML_CALLOUT_ENTRY.type]);
				}

				return parsed;
			});
	}

	return result;
}

/**
 * Parses a text style subsection (COLOUR, BOLD, ITALIC).
 *
 * @param styleObj - The subsection object (e.g., RENDER.PROMPT)
 * @returns Parsed text style configuration
 */
function parseTextStyleSubsection(styleObj: Record<string, unknown> | undefined): YamlTextStyleConfig | undefined {
	if (!styleObj || typeof styleObj !== 'object') {
		return undefined;
	}

	return {
		COLOUR: styleObj[YAML_TEXT_STYLE.colour] !== undefined
			? String(styleObj[YAML_TEXT_STYLE.colour])
			: undefined,
		BOLD: styleObj[YAML_TEXT_STYLE.bold] !== undefined
			? resolveBoolean(styleObj[YAML_TEXT_STYLE.bold], false)
			: undefined,
		ITALIC: styleObj[YAML_TEXT_STYLE.italic] !== undefined
			? resolveBoolean(styleObj[YAML_TEXT_STYLE.italic], false)
			: undefined,
	};
}

/**
 * Parses the RENDER section from YAML configuration (for cmdout blocks).
 *
 * @param yamlProps - Parsed YAML properties
 * @returns RENDER section configuration for cmdout styling
 */
export function parseRenderCmdoutSection(yamlProps: Record<string, unknown>): YamlRenderCmdoutConfig {
	const render = getSection(yamlProps, YAML_SECTIONS.render);

	return {
		PROMPT: parseTextStyleSubsection(render[YAML_RENDER_CMDOUT.prompt] as Record<string, unknown> | undefined),
		COMMAND: parseTextStyleSubsection(render[YAML_RENDER_CMDOUT.command] as Record<string, unknown> | undefined),
		OUTPUT: parseTextStyleSubsection(render[YAML_RENDER_CMDOUT.output] as Record<string, unknown> | undefined),
	};
}

/**
 * Parses complete nested YAML configuration from a ufence block.
 *
 * @param yamlProps - Parsed YAML properties from parseBlockContent
 * @returns Complete parsed YAML configuration
 */
export function parseNestedYamlConfig(yamlProps: Record<string, unknown>): ParsedYamlConfig {
	return {
		META: parseMetaSection(yamlProps),
		RENDER: parseRenderDisplaySection(yamlProps),
		FILTER: parseFilterSection(yamlProps),
		CALLOUT: parseCalloutSection(yamlProps),
		// Top-level PROMPT for cmdout blocks
		PROMPT: yamlProps[YAML_PROMPT] !== undefined
		? (typeof yamlProps[YAML_PROMPT] === 'string' ? yamlProps[YAML_PROMPT] : String(yamlProps[YAML_PROMPT] as number | boolean))
		: undefined,
		// RENDER section for cmdout styling (stored separately as RENDER_CMDOUT)
		RENDER_CMDOUT: parseRenderCmdoutSection(yamlProps),
	};
}

/**
 * Parses a raw YAML string (from a saved preset) into a ParsedYamlConfig.
 *
 * This is used to convert the free-form YAML stored in plugin settings into
 * the same structured format used by code block configs.
 *
 * @param yamlString - Raw YAML string from a preset
 * @returns Parsed YAML configuration, or empty config on failure
 */
export function parsePresetYaml(yamlString: string): ParsedYamlConfig {
	if (!yamlString || !yamlString.trim()) {
		return {};
	}

	try {
		const yamlProps = parseYaml(yamlString) as Record<string, unknown>;
		if (!yamlProps || typeof yamlProps !== 'object') {
			return {};
		}
		return parseNestedYamlConfig(yamlProps);
	} catch {
		return {};
	}
}

/**
 * Resolves parsed YAML configuration with plugin defaults for code blocks.
 *
 * @param parsed - Parsed YAML configuration
 * @param settings - Plugin settings (for defaults)
 * @param defaultLanguage - Default language from processor registration
 * @returns Fully resolved configuration ready for rendering
 */
export function resolveBlockConfig(
	parsed: ParsedYamlConfig,
	settings: PluginSettings,
	defaultLanguage: string
): ResolvedBlockConfig {
	// Parse line range if specified
	const lineRange = parsed.FILTER?.BY_LINES?.RANGE
		? parseLineRange(parsed.FILTER.BY_LINES.RANGE)
		: null;

	// Determine if BY_MARKS is enabled (both start and end required)
	const byMarksEnabled = !!(parsed.FILTER?.BY_MARKS?.START && parsed.FILTER?.BY_MARKS?.END);

	return {
		// META section
		sourcePath: parsed.META?.PATH ?? null,
		titleTemplate: parsed.META?.TITLE ?? '',
		descriptionText: parsed.META?.DESC ?? '',

		// RENDER section
		titleBarStyle: (parsed.RENDER?.STYLE as TitleBarStyle) ?? settings.defaultTitleBarStyle,
		language: parsed.RENDER?.LANG ?? defaultLanguage,
		foldLines: parsed.RENDER?.FOLD ?? settings.foldLines,
		scrollLines: parsed.RENDER?.SCROLL ?? settings.scrollLines,
		showZebraStripes: parsed.RENDER?.ZEBRA ?? settings.showZebraStripes,
		showLineNumbers: parsed.RENDER?.LINES ?? settings.showLineNumbers,
		showCopyButton: parsed.RENDER?.COPY ?? settings.showCopyButton,
		shiftCopyJoin: parsed.RENDER?.SHIFT_COPY_JOIN
			?? settings.languageCopyJoinDefaults[defaultLanguage]?.shiftJoin
			?? '',
		altCopyJoin: parsed.RENDER?.ALT_COPY_JOIN
			?? settings.languageCopyJoinDefaults[defaultLanguage]?.altJoin
			?? '',
		joinIgnoreRegex: parsed.RENDER?.JOIN_IGNORE_REGEX
			?? settings.languageCopyJoinDefaults[defaultLanguage]?.joinIgnoreRegex
			?? '',

		// FILTER section - BY_LINES
		filterByLines: {
			enabled: lineRange !== null,
			start: lineRange?.[0] ?? 0,
			end: lineRange?.[1] ?? 0,
			inclusive: parsed.FILTER?.BY_LINES?.INCLUSIVE ?? true,
		},

		// FILTER section - BY_MARKS
		filterByMarks: {
			enabled: byMarksEnabled,
			startMarker: parsed.FILTER?.BY_MARKS?.START ?? '',
			endMarker: parsed.FILTER?.BY_MARKS?.END ?? '',
			inclusive: parsed.FILTER?.BY_MARKS?.INCLUSIVE ?? true,
		},

		// Print behaviour
		printBehaviour: parsed.RENDER?.PRINT ?? settings.printBehaviour,

		// CALLOUT section — placeholder; resolved in main.ts with source code
		calloutConfig: {
			enabled: false,
			displayMode: 'inline',
			printDisplayMode: 'inline',
			style: 'standard',
			entries: [],
		},
	};
}

/**
 * Resolves parsed YAML callout configuration with actual source code.
 *
 * Matches callout entries to concrete line numbers by resolving
 * LINE (direct), MARK (string search), and LINES (range) targets.
 *
 * @param parsed - Parsed YAML callout configuration
 * @param sourceCode - The source code (used to resolve MARK targets)
 * @param totalLineCount - Total lines in source code
 * @returns Fully resolved callout configuration
 */
export function resolveCalloutConfig(
	parsed: YamlCalloutConfig | undefined,
	sourceCode: string,
	totalLineCount: number
): ResolvedCalloutConfig {
	if (!parsed || !parsed.ENTRIES || parsed.ENTRIES.length === 0) {
		return {
			enabled: false,
			displayMode: 'inline',
			printDisplayMode: 'inline',
			style: 'standard',
			entries: [],
		};
	}

	const displayMode = (parsed.DISPLAY ?? 'inline') as 'inline' | 'footnote' | 'popover';
	const rawPrintDisplay = parsed.PRINT_DISPLAY ?? 'inline';
	const printDisplayMode = rawPrintDisplay === 'footnote' ? 'footnote' : 'inline';
	const style = parsed.STYLE === 'border' ? 'border' : 'standard';
	const sourceLines = sourceCode.split('\n');

	const resolvedEntries = parsed.ENTRIES
		.filter(entry => entry.TEXT) // Only entries with text
		.map(entry => resolveCalloutEntry(entry, sourceLines, totalLineCount, displayMode))
		.filter(entry => entry.enabled); // Filter out entries with no matching lines

	return {
		enabled: resolvedEntries.length > 0,
		displayMode,
		printDisplayMode,
		style,
		entries: resolvedEntries,
	};
}

/**
 * Resolves a single callout entry to actual line numbers.
 *
 * Priority: LINE > MARK > LINES (first matching target type wins).
 *
 * @param entry - Parsed callout entry
 * @param sourceLines - Array of source code lines
 * @param totalLineCount - Total line count
 * @param defaultDisplayMode - Default display mode from CALLOUT section
 * @returns Resolved entry with target line numbers
 */
function resolveCalloutEntry(
	entry: YamlCalloutEntry,
	sourceLines: string[],
	totalLineCount: number,
	defaultDisplayMode: 'inline' | 'footnote' | 'popover'
): ResolvedCalloutEntry {
	let targetLines: number[] = [];

	// Try LINE first (direct line number reference)
	if (entry.LINE !== undefined && entry.LINE > 0 && entry.LINE <= totalLineCount) {
		targetLines = [entry.LINE];
	}
	// Try MARK (search for marker string in source code)
	else if (entry.MARK !== undefined) {
		const lineIndex = sourceLines.findIndex(line => line.includes(entry.MARK!));
		if (lineIndex >= 0) {
			targetLines = [lineIndex + 1]; // Convert 0-based to 1-based
		}
	}
	// Try LINES (range specification)
	else if (entry.LINES !== undefined) {
		const range = parseLineRange(entry.LINES);
		if (range) {
			const [start, end] = range;
			targetLines = Array.from(
				{ length: end - start + 1 },
				(_, i) => start + i
			).filter(lineNum => lineNum >= 1 && lineNum <= totalLineCount);
		}
	}

	const entryDisplayMode = (entry.DISPLAY ?? defaultDisplayMode) as 'inline' | 'footnote' | 'popover';
	const type = normalizeCalloutType(entry.TYPE ?? 'note');

	return {
		enabled: targetLines.length > 0,
		targetLines,
		text: entry.TEXT || '',
		replace: entry.REPLACE ?? false,
		displayMode: entryDisplayMode,
		type,
	};
}

/**
 * Resolves parsed YAML configuration with plugin defaults for cmdout blocks.
 *
 * @param parsed - Parsed YAML configuration
 * @param settings - Plugin settings (for defaults)
 * @returns Fully resolved configuration ready for rendering
 */
export function resolveCmdoutConfig(
	parsed: ParsedYamlConfig,
	settings: PluginSettings
): ResolvedCmdoutConfig {
	// Build prompt pattern from top-level PROMPT property
	let promptPattern: RegExp | undefined;
	if (parsed.PROMPT) {
		promptPattern = createSafeRegex(parsed.PROMPT) ?? undefined;
	}

	// Build styles from RENDER section (cmdout styling) with settings as defaults
	const styles: CommandOutputStyles = {
		promptColour: parsed.RENDER_CMDOUT?.PROMPT?.COLOUR ?? settings.commandPromptColour,
		promptBold: parsed.RENDER_CMDOUT?.PROMPT?.BOLD ?? settings.commandPromptBold,
		promptItalic: parsed.RENDER_CMDOUT?.PROMPT?.ITALIC ?? settings.commandPromptItalic,
		commandColour: parsed.RENDER_CMDOUT?.COMMAND?.COLOUR ?? settings.commandTextColour,
		commandBold: parsed.RENDER_CMDOUT?.COMMAND?.BOLD ?? settings.commandTextBold,
		commandItalic: parsed.RENDER_CMDOUT?.COMMAND?.ITALIC ?? settings.commandTextItalic,
		outputColour: parsed.RENDER_CMDOUT?.OUTPUT?.COLOUR ?? settings.outputTextColour,
		outputBold: parsed.RENDER_CMDOUT?.OUTPUT?.BOLD ?? settings.outputTextBold,
		outputItalic: parsed.RENDER_CMDOUT?.OUTPUT?.ITALIC ?? settings.outputTextItalic,
	};

	return {
		// META section
		titleText: parsed.META?.TITLE,
		descriptionText: parsed.META?.DESC ?? '',

		// RENDER section (display options)
		scrollLines: parsed.RENDER?.SCROLL ?? settings.scrollLines,
		showCopyButton: parsed.RENDER?.COPY ?? settings.showCopyButton,

		// RENDER section (cmdout styling)
		promptPattern,
		styles,

		// Print behaviour
		printBehaviour: parsed.RENDER?.PRINT ?? settings.printBehaviour,
	};
}
