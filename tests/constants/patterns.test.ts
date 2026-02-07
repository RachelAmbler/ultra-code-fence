/**
 * Tests for src/constants/patterns.ts and related constants
 *
 * Covers: styleClass, CSS_CLASSES integrity, YAML constant integrity,
 * and countSourceLines from code-block.ts
 */

import { describe, it, expect } from 'vitest';
import {
	styleClass,
	CSS_CLASSES,
	CSS_PREFIX,
	VAULT_PREFIX,
	HTTPS_PREFIX,
	HTTP_PREFIX,
	INLINE_CODE_SEPARATOR,
	INLINE_CODE_SEPARATOR_END,
	LINE_HEIGHT_MULTIPLIER,
	SCROLL_BOTTOM_TOLERANCE,
	WHATS_NEW_DELAY_MS,
	COPY_SUCCESS_DURATION_MS,
	YAML_SECTIONS,
	YAML_META,
	YAML_RENDER_DISPLAY,
	YAML_FILTER,
	YAML_FILTER_BY_LINES,
	YAML_FILTER_BY_MARKS,
	YAML_RENDER_CMDOUT,
	YAML_TEXT_STYLE,
	YAML_PROMPT,
	ICON_IMAGE_EXTENSIONS,
} from '../../src/constants/patterns';
import { countSourceLines } from '../../src/renderers/code-block';

// =============================================================================
// styleClass
// =============================================================================

describe('styleClass', () => {
	it('generates a style class with prefix', () => {
		expect(styleClass('tab')).toBe('style-tab');
	});

	it('generates style class for infobar', () => {
		expect(styleClass('infobar')).toBe('style-infobar');
	});

	it('handles empty string', () => {
		expect(styleClass('')).toBe('style-');
	});

	it('preserves case of input', () => {
		expect(styleClass('Tab')).toBe('style-Tab');
	});
});

// =============================================================================
// CSS_CLASSES integrity
// =============================================================================

describe('CSS_CLASSES', () => {
	it('all values start with the CSS prefix', () => {
		const nonPrefixed: string[] = [];
		for (const [key, value] of Object.entries(CSS_CLASSES)) {
			if (!value.startsWith(CSS_PREFIX) && !value.startsWith('style-') && !value.startsWith('has-')) {
				nonPrefixed.push(`${key}: "${value}"`);
			}
		}
		expect(nonPrefixed).toEqual([]);
	});

	it('has no duplicate values', () => {
		const values = Object.values(CSS_CLASSES);
		const uniqueValues = new Set(values);
		expect(values.length).toBe(uniqueValues.size);
	});

	it('contains expected core classes', () => {
		expect(CSS_CLASSES.container).toBe('ucf');
		expect(CSS_CLASSES.codeBlock).toBe('ucf-code');
		expect(CSS_CLASSES.title).toBe('ucf-title');
		expect(CSS_CLASSES.copyButton).toBe('ucf-copy-button');
		expect(CSS_CLASSES.line).toBe('ucf-line');
	});
});

// =============================================================================
// Path prefix constants
// =============================================================================

describe('path prefix constants', () => {
	it('VAULT_PREFIX is vault://', () => {
		expect(VAULT_PREFIX).toBe('vault://');
	});

	it('HTTPS_PREFIX is https://', () => {
		expect(HTTPS_PREFIX).toBe('https://');
	});

	it('HTTP_PREFIX is http://', () => {
		expect(HTTP_PREFIX).toBe('http://');
	});
});

// =============================================================================
// Separator constants
// =============================================================================

describe('separator constants', () => {
	it('INLINE_CODE_SEPARATOR has newlines around ~~~', () => {
		expect(INLINE_CODE_SEPARATOR).toBe('\n~~~\n');
	});

	it('INLINE_CODE_SEPARATOR_END has leading newline only', () => {
		expect(INLINE_CODE_SEPARATOR_END).toBe('\n~~~');
	});
});

// =============================================================================
// Numeric constants
// =============================================================================

describe('numeric constants', () => {
	it('LINE_HEIGHT_MULTIPLIER is positive', () => {
		expect(LINE_HEIGHT_MULTIPLIER).toBeGreaterThan(0);
	});

	it('SCROLL_BOTTOM_TOLERANCE is positive', () => {
		expect(SCROLL_BOTTOM_TOLERANCE).toBeGreaterThan(0);
	});

	it('WHATS_NEW_DELAY_MS is at least 500ms', () => {
		expect(WHATS_NEW_DELAY_MS).toBeGreaterThanOrEqual(500);
	});

	it('COPY_SUCCESS_DURATION_MS is at least 1000ms', () => {
		expect(COPY_SUCCESS_DURATION_MS).toBeGreaterThanOrEqual(1000);
	});
});

// =============================================================================
// YAML constant integrity
// =============================================================================

describe('YAML section constants', () => {
	it('YAML_SECTIONS has expected keys', () => {
		expect(YAML_SECTIONS.meta).toBe('META');
		expect(YAML_SECTIONS.render).toBe('RENDER');
		expect(YAML_SECTIONS.filter).toBe('FILTER');
	});

	it('YAML_META has expected keys', () => {
		expect(YAML_META.path).toBe('PATH');
		expect(YAML_META.title).toBe('TITLE');
		expect(YAML_META.desc).toBe('DESC');
	});

	it('YAML_RENDER_DISPLAY has expected keys', () => {
		expect(YAML_RENDER_DISPLAY.fold).toBe('FOLD');
		expect(YAML_RENDER_DISPLAY.scroll).toBe('SCROLL');
		expect(YAML_RENDER_DISPLAY.zebra).toBe('ZEBRA');
		expect(YAML_RENDER_DISPLAY.lines).toBe('LINES');
		expect(YAML_RENDER_DISPLAY.copy).toBe('COPY');
		expect(YAML_RENDER_DISPLAY.style).toBe('STYLE');
		expect(YAML_RENDER_DISPLAY.lang).toBe('LANG');
	});

	it('YAML_FILTER has expected keys', () => {
		expect(YAML_FILTER.byLines).toBe('BY_LINES');
		expect(YAML_FILTER.byMarks).toBe('BY_MARKS');
	});

	it('YAML_FILTER_BY_LINES has range and inclusive', () => {
		expect(YAML_FILTER_BY_LINES.range).toBe('RANGE');
		expect(YAML_FILTER_BY_LINES.inclusive).toBe('INCLUSIVE');
	});

	it('YAML_FILTER_BY_MARKS has start, end, inclusive', () => {
		expect(YAML_FILTER_BY_MARKS.start).toBe('START');
		expect(YAML_FILTER_BY_MARKS.end).toBe('END');
		expect(YAML_FILTER_BY_MARKS.inclusive).toBe('INCLUSIVE');
	});

	it('YAML_RENDER_CMDOUT has prompt, command, output', () => {
		expect(YAML_RENDER_CMDOUT.prompt).toBe('PROMPT');
		expect(YAML_RENDER_CMDOUT.command).toBe('COMMAND');
		expect(YAML_RENDER_CMDOUT.output).toBe('OUTPUT');
	});

	it('YAML_TEXT_STYLE has colour, bold, italic', () => {
		expect(YAML_TEXT_STYLE.colour).toBe('COLOUR');
		expect(YAML_TEXT_STYLE.bold).toBe('BOLD');
		expect(YAML_TEXT_STYLE.italic).toBe('ITALIC');
	});

	it('YAML_PROMPT is PROMPT', () => {
		expect(YAML_PROMPT).toBe('PROMPT');
	});

	it('all YAML values are uppercase', () => {
		const allValues = [
			...Object.values(YAML_SECTIONS),
			...Object.values(YAML_META),
			...Object.values(YAML_RENDER_DISPLAY),
			...Object.values(YAML_FILTER),
			...Object.values(YAML_FILTER_BY_LINES),
			...Object.values(YAML_FILTER_BY_MARKS),
			...Object.values(YAML_RENDER_CMDOUT),
			...Object.values(YAML_TEXT_STYLE),
			YAML_PROMPT,
		];
		for (const val of allValues) {
			expect(val).toBe(val.toUpperCase());
		}
	});
});

// =============================================================================
// ICON_IMAGE_EXTENSIONS
// =============================================================================

describe('ICON_IMAGE_EXTENSIONS', () => {
	it('includes svg', () => {
		expect(ICON_IMAGE_EXTENSIONS).toContain('svg');
	});

	it('includes png', () => {
		expect(ICON_IMAGE_EXTENSIONS).toContain('png');
	});

	it('includes common web formats', () => {
		expect(ICON_IMAGE_EXTENSIONS).toContain('jpg');
		expect(ICON_IMAGE_EXTENSIONS).toContain('jpeg');
		expect(ICON_IMAGE_EXTENSIONS).toContain('gif');
		expect(ICON_IMAGE_EXTENSIONS).toContain('webp');
	});

	it('all extensions are lowercase', () => {
		for (const ext of ICON_IMAGE_EXTENSIONS) {
			expect(ext).toBe(ext.toLowerCase());
		}
	});
});

// =============================================================================
// countSourceLines (from code-block.ts)
// =============================================================================

describe('countSourceLines', () => {
	it('counts lines in multiline content', () => {
		expect(countSourceLines('a\nb\nc')).toBe(3);
	});

	it('counts single line', () => {
		expect(countSourceLines('hello')).toBe(1);
	});

	it('returns 0 for empty string', () => {
		expect(countSourceLines('')).toBe(0);
	});

	it('counts trailing newline as extra line', () => {
		expect(countSourceLines('a\nb\n')).toBe(3);
	});
});
