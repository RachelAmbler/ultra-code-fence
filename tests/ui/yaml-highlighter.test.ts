/**
 * Tests for the YAML syntax highlighter.
 */

import { describe, it, expect } from 'vitest';
import { highlightYaml } from '../../src/ui/yaml-highlighter';

// Helper: extract text content only (strip tags)
function stripTags(html: string): string {
	return html.replace(/<[^>]+>/g, '');
}

// Helper: check a span class exists wrapping specific text
function hasSpan(html: string, cls: string, text: string): boolean {
	return html.includes(`<span class="${cls}">${text}</span>`);
}

describe('highlightYaml', () => {
	// =================================================================
	// Empty / blank input
	// =================================================================

	it('returns empty string for empty input', () => {
		expect(highlightYaml('')).toBe('');
	});

	it('returns empty string for undefined-ish input', () => {
		expect(highlightYaml(null as unknown as string)).toBe('');
		expect(highlightYaml(undefined as unknown as string)).toBe('');
	});

	it('preserves blank lines', () => {
		const result = highlightYaml('KEY: val\n\nKEY2: val2');
		expect(result.split('\n')).toHaveLength(3);
		expect(result.split('\n')[1]).toBe('');
	});

	// =================================================================
	// Key-value pairs
	// =================================================================

	it('highlights a simple key-value pair', () => {
		const result = highlightYaml('LINES: true');
		expect(hasSpan(result, 'ucf-yaml-key', 'LINES')).toBe(true);
		expect(hasSpan(result, 'ucf-yaml-punctuation', ': ')).toBe(true);
		expect(hasSpan(result, 'ucf-yaml-value', 'true')).toBe(true);
	});

	it('highlights indented key-value pairs', () => {
		const result = highlightYaml('  LINES: true');
		expect(hasSpan(result, 'ucf-yaml-key', 'LINES')).toBe(true);
		expect(hasSpan(result, 'ucf-yaml-value', 'true')).toBe(true);
	});

	it('highlights multi-word keys', () => {
		const result = highlightYaml('SHIFT COPY JOIN: "&&"');
		expect(hasSpan(result, 'ucf-yaml-key', 'SHIFT COPY JOIN')).toBe(true);
	});

	// =================================================================
	// String values
	// =================================================================

	it('highlights double-quoted strings', () => {
		const result = highlightYaml('TITLE: "hello.py"');
		expect(hasSpan(result, 'ucf-yaml-key', 'TITLE')).toBe(true);
		expect(result).toContain('ucf-yaml-string');
		expect(result).toContain('"hello.py"');
	});

	it('highlights single-quoted strings', () => {
		const result = highlightYaml("TITLE: 'hello.py'");
		expect(result).toContain('ucf-yaml-string');
		expect(result).toContain("'hello.py'");
	});

	it('highlights unquoted string values', () => {
		const result = highlightYaml('STYLE: integrated');
		expect(result).toContain('ucf-yaml-string');
		expect(result).toContain('integrated');
	});

	// =================================================================
	// Boolean and numeric values
	// =================================================================

	it('highlights boolean true', () => {
		const result = highlightYaml('ZEBRA: true');
		expect(hasSpan(result, 'ucf-yaml-value', 'true')).toBe(true);
	});

	it('highlights boolean false', () => {
		const result = highlightYaml('COPY: false');
		expect(hasSpan(result, 'ucf-yaml-value', 'false')).toBe(true);
	});

	it('highlights yes/no as booleans', () => {
		expect(highlightYaml('LINES: yes')).toContain('ucf-yaml-value');
		expect(highlightYaml('LINES: no')).toContain('ucf-yaml-value');
	});

	it('highlights integer values', () => {
		const result = highlightYaml('FOLD: 20');
		expect(hasSpan(result, 'ucf-yaml-value', '20')).toBe(true);
	});

	it('highlights negative numbers', () => {
		const result = highlightYaml('OFFSET: -5');
		expect(hasSpan(result, 'ucf-yaml-value', '-5')).toBe(true);
	});

	it('highlights float values', () => {
		const result = highlightYaml('RATIO: 1.5');
		expect(hasSpan(result, 'ucf-yaml-value', '1.5')).toBe(true);
	});

	it('highlights null values', () => {
		const result = highlightYaml('VALUE: null');
		expect(hasSpan(result, 'ucf-yaml-value', 'null')).toBe(true);
	});

	// =================================================================
	// Comments
	// =================================================================

	it('highlights full-line comments', () => {
		const result = highlightYaml('# This is a comment');
		expect(hasSpan(result, 'ucf-yaml-comment', '# This is a comment')).toBe(true);
	});

	it('highlights indented comments', () => {
		const result = highlightYaml('  # Indented comment');
		expect(hasSpan(result, 'ucf-yaml-comment', '  # Indented comment')).toBe(true);
	});

	it('highlights inline comments after values', () => {
		const result = highlightYaml('FOLD: 20 # max lines');
		expect(result).toContain('ucf-yaml-comment');
		expect(result).toContain('# max lines');
	});

	// =================================================================
	// List items
	// =================================================================

	it('highlights list item dashes', () => {
		const result = highlightYaml('  - LINE: 3');
		expect(hasSpan(result, 'ucf-yaml-punctuation', '- ')).toBe(true);
		expect(hasSpan(result, 'ucf-yaml-key', 'LINE')).toBe(true);
	});

	it('highlights plain list values', () => {
		const result = highlightYaml('  - python');
		expect(hasSpan(result, 'ucf-yaml-punctuation', '- ')).toBe(true);
		expect(result).toContain('ucf-yaml-string');
	});

	// =================================================================
	// Array shorthand
	// =================================================================

	it('highlights array shorthand values', () => {
		const result = highlightYaml('LINES: [3, 5]');
		expect(result).toContain('ucf-yaml-value');
		expect(result).toContain('[3, 5]');
	});

	// =================================================================
	// Nested YAML structures
	// =================================================================

	it('highlights a full multi-line YAML block', () => {
		const yaml = [
			'META:',
			'  TITLE: "example.py"',
			'  PRESET: "teaching"',
			'RENDER:',
			'  LINES: true',
			'  ZEBRA: false',
			'  FOLD: 20',
		].join('\n');

		const result = highlightYaml(yaml);

		// Check keys
		expect(result).toContain('ucf-yaml-key');
		expect(stripTags(result)).toContain('META');
		expect(stripTags(result)).toContain('TITLE');
		expect(stripTags(result)).toContain('LINES');

		// Check values
		expect(result).toContain('ucf-yaml-value');
		expect(result).toContain('ucf-yaml-string');

		// Should have 7 lines
		expect(result.split('\n')).toHaveLength(7);
	});

	// =================================================================
	// HTML escaping
	// =================================================================

	it('escapes HTML entities in keys', () => {
		const result = highlightYaml('KEY<script>: value');
		expect(result).toContain('&lt;script&gt;');
		expect(result).not.toContain('<script>');
	});

	it('escapes HTML entities in values', () => {
		const result = highlightYaml('TEXT: "hello <b>world</b>"');
		expect(result).toContain('&lt;b&gt;');
		expect(result).not.toContain('<b>');
	});

	it('escapes ampersands', () => {
		const result = highlightYaml('DESC: "cats & dogs"');
		expect(result).toContain('&amp;');
	});

	// =================================================================
	// Colons
	// =================================================================

	it('highlights colon as punctuation', () => {
		const result = highlightYaml('KEY: value');
		expect(hasSpan(result, 'ucf-yaml-punctuation', ': ')).toBe(true);
	});

	it('handles keys with no value (section headers)', () => {
		const result = highlightYaml('RENDER:');
		expect(hasSpan(result, 'ucf-yaml-key', 'RENDER')).toBe(true);
		expect(result).toContain('ucf-yaml-punctuation');
	});

	// =================================================================
	// Text content preservation
	// =================================================================

	it('preserves all original text content', () => {
		const yaml = 'META:\n  TITLE: "hello"\n  # comment\nRENDER:\n  FOLD: 20';
		const result = highlightYaml(yaml);
		const text = stripTags(result);
		expect(text).toBe(yaml);
	});
});
