/**
 * Tests for CALLOUT resolver functions in yaml-parser.ts
 *
 * Covers: resolveCalloutConfig, resolveCalloutEntry
 */

import { describe, it, expect } from 'vitest';
import { resolveCalloutConfig } from '../../src/parsers/yaml-parser';
import type { YamlCalloutConfig } from '../../src/types';

const SAMPLE_CODE = `import { db } from './database';
// @note
const user = authenticate(token);
const result = db.query(sql);
return result;`;

const SAMPLE_LINE_COUNT = 5;

// =============================================================================
// resolveCalloutConfig — Basic
// =============================================================================

describe('resolveCalloutConfig basic', () => {
	it('returns disabled config when CALLOUT is undefined', () => {
		const result = resolveCalloutConfig(undefined, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.enabled).toBe(false);
		expect(result.entries).toEqual([]);
	});

	it('returns disabled config when ENTRIES is undefined', () => {
		const result = resolveCalloutConfig({ DISPLAY: 'inline' }, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.enabled).toBe(false);
	});

	it('returns disabled config when ENTRIES is empty', () => {
		const result = resolveCalloutConfig({ ENTRIES: [] }, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.enabled).toBe(false);
	});

	it('returns disabled config when all entries lack TEXT', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 1 }, { MARK: '// @note' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.enabled).toBe(false);
	});

	it('returns enabled config with valid entries', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 1, TEXT: 'Test' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.enabled).toBe(true);
		expect(result.entries).toHaveLength(1);
	});

	it('defaults displayMode to inline', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 1, TEXT: 'Test' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.displayMode).toBe('inline');
	});

	it('uses DISPLAY from section', () => {
		const result = resolveCalloutConfig({
			DISPLAY: 'footnote',
			ENTRIES: [{ LINE: 1, TEXT: 'Test' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.displayMode).toBe('footnote');
	});

	it('defaults printDisplayMode to inline', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 1, TEXT: 'Test' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.printDisplayMode).toBe('inline');
	});

	it('uses PRINT_DISPLAY from section', () => {
		const result = resolveCalloutConfig({
			PRINT_DISPLAY: 'footnote',
			ENTRIES: [{ LINE: 1, TEXT: 'Test' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.printDisplayMode).toBe('footnote');
	});

	it('PRINT_DISPLAY only accepts inline or footnote', () => {
		const result = resolveCalloutConfig({
			PRINT_DISPLAY: 'popover',
			ENTRIES: [{ LINE: 1, TEXT: 'Test' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		// popover is not valid for print; should default to inline
		expect(result.printDisplayMode).toBe('inline');
	});

	it('defaults style to standard', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 1, TEXT: 'Test' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.style).toBe('standard');
	});

	it('uses STYLE border from section', () => {
		const result = resolveCalloutConfig({
			STYLE: 'border',
			ENTRIES: [{ LINE: 1, TEXT: 'Test' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.style).toBe('border');
	});

	it('STYLE defaults to standard for unknown values', () => {
		const result = resolveCalloutConfig({
			STYLE: 'fancy',
			ENTRIES: [{ LINE: 1, TEXT: 'Test' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.style).toBe('standard');
	});
});

// =============================================================================
// LINE resolution
// =============================================================================

describe('resolveCalloutConfig LINE resolution', () => {
	it('resolves valid LINE number', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 3, TEXT: 'Line 3' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].targetLines).toEqual([3]);
	});

	it('resolves LINE 1 (first line)', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 1, TEXT: 'First' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].targetLines).toEqual([1]);
	});

	it('resolves LINE equal to total line count', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 5, TEXT: 'Last' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].targetLines).toEqual([5]);
	});

	it('disables entry when LINE exceeds total', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 10, TEXT: 'Too far' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.enabled).toBe(false);
	});

	it('disables entry when LINE is 0', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 0, TEXT: 'Zero' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.enabled).toBe(false);
	});

	it('disables entry when LINE is negative', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: -1, TEXT: 'Negative' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.enabled).toBe(false);
	});
});

// =============================================================================
// MARK resolution
// =============================================================================

describe('resolveCalloutConfig MARK resolution', () => {
	it('finds line containing MARK string', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ MARK: '// @note', TEXT: 'Found' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].targetLines).toEqual([2]);
	});

	it('finds partial match', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ MARK: 'authenticate', TEXT: 'Auth' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].targetLines).toEqual([3]);
	});

	it('disables entry when MARK not found', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ MARK: 'nonexistent', TEXT: 'Missing' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.enabled).toBe(false);
	});

	it('case-sensitive matching', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ MARK: '// @NOTE', TEXT: 'Wrong case' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		// "// @NOTE" is not in the code (only "// @note"), so disabled
		expect(result.enabled).toBe(false);
	});

	it('matches first occurrence when multiple lines match', () => {
		const code = 'return a;\nreturn b;\nreturn c;';
		const result = resolveCalloutConfig({
			ENTRIES: [{ MARK: 'return', TEXT: 'First' }],
		}, code, 3);
		expect(result.entries[0].targetLines).toEqual([1]);
	});
});

// =============================================================================
// LINES resolution
// =============================================================================

describe('resolveCalloutConfig LINES resolution', () => {
	it('resolves string range "2, 4"', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINES: '2, 4', TEXT: 'Range' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].targetLines).toEqual([2, 3, 4]);
	});

	it('resolves array range [1, 3]', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINES: [1, 3], TEXT: 'Range' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].targetLines).toEqual([1, 2, 3]);
	});

	it('clamps range to valid line numbers', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINES: '3, 10', TEXT: 'Clamped' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].targetLines).toEqual([3, 4, 5]);
	});

	it('disables entry when range is invalid', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINES: 'invalid', TEXT: 'Bad range' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.enabled).toBe(false);
	});

	it('single-line range (start == end)', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINES: '3, 3', TEXT: 'Single' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].targetLines).toEqual([3]);
	});
});

// =============================================================================
// Display mode resolution
// =============================================================================

describe('resolveCalloutConfig display mode', () => {
	it('uses entry DISPLAY if specified', () => {
		const result = resolveCalloutConfig({
			DISPLAY: 'inline',
			ENTRIES: [{ LINE: 1, TEXT: 'Test', DISPLAY: 'popover' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].displayMode).toBe('popover');
	});

	it('falls back to section DISPLAY', () => {
		const result = resolveCalloutConfig({
			DISPLAY: 'footnote',
			ENTRIES: [{ LINE: 1, TEXT: 'Test' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].displayMode).toBe('footnote');
	});

	it('defaults to inline when no DISPLAY specified', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 1, TEXT: 'Test' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].displayMode).toBe('inline');
	});
});

// =============================================================================
// REPLACE resolution
// =============================================================================

describe('resolveCalloutConfig REPLACE', () => {
	it('resolves REPLACE: true', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 1, TEXT: 'Test', REPLACE: true }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].replace).toBe(true);
	});

	it('resolves REPLACE: false', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 1, TEXT: 'Test', REPLACE: false }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].replace).toBe(false);
	});

	it('defaults REPLACE to false', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 1, TEXT: 'Test' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].replace).toBe(false);
	});
});

// =============================================================================
// Multiple entries
// =============================================================================

describe('resolveCalloutConfig multiple entries', () => {
	it('resolves multiple valid entries', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [
				{ LINE: 1, TEXT: 'First' },
				{ LINE: 3, TEXT: 'Second' },
				{ MARK: '// @note', TEXT: 'Third' },
			],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries).toHaveLength(3);
		expect(result.entries[0].text).toBe('First');
		expect(result.entries[1].text).toBe('Second');
		expect(result.entries[2].text).toBe('Third');
	});

	it('filters out invalid entries', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [
				{ LINE: 1, TEXT: 'Valid' },
				{ LINE: 100, TEXT: 'Out of range' },
				{ MARK: 'nonexistent', TEXT: 'Not found' },
				{ LINE: 3, TEXT: 'Also valid' },
			],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries).toHaveLength(2);
		expect(result.entries[0].text).toBe('Valid');
		expect(result.entries[1].text).toBe('Also valid');
	});

	it('preserves entry order', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [
				{ LINE: 5, TEXT: 'Last line' },
				{ LINE: 1, TEXT: 'First line' },
				{ LINE: 3, TEXT: 'Middle line' },
			],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		expect(result.entries[0].text).toBe('Last line');
		expect(result.entries[1].text).toBe('First line');
		expect(result.entries[2].text).toBe('Middle line');
	});

	it('filters entries without TEXT', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [
				{ LINE: 1, TEXT: 'Has text' },
				{ LINE: 2 },
				{ LINE: 3, TEXT: '' },
			],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		// Only the first has TEXT; entry with empty string '' has TEXT but is falsy
		expect(result.entries).toHaveLength(1);
		expect(result.entries[0].text).toBe('Has text');
	});
});

// =============================================================================
// Edge cases
// =============================================================================

describe('resolveCalloutConfig edge cases', () => {
	it('handles empty source code', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 1, TEXT: 'Test' }],
		}, '', 0);
		expect(result.enabled).toBe(false);
	});

	it('handles single-line source code', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 1, TEXT: 'Test' }],
		}, 'hello', 1);
		expect(result.enabled).toBe(true);
		expect(result.entries[0].targetLines).toEqual([1]);
	});

	it('entry with both LINE and MARK uses LINE', () => {
		const result = resolveCalloutConfig({
			ENTRIES: [{ LINE: 1, MARK: '// @note', TEXT: 'Test' }],
		}, SAMPLE_CODE, SAMPLE_LINE_COUNT);
		// LINE takes precedence
		expect(result.entries[0].targetLines).toEqual([1]);
	});
});

// =============================================================================
// resolveCalloutConfig - TYPE field
// =============================================================================

describe('resolveCalloutConfig - TYPE field', () => {
	const sampleCode = 'line one\nline two\nline three';

	it('defaults type to "note" when TYPE not specified', () => {
		const config: YamlCalloutConfig = {
			DISPLAY: 'inline',
			ENTRIES: [{ LINE: 1, TEXT: 'test' }],
		};
		const result = resolveCalloutConfig(config, sampleCode, 3);
		expect(result.entries[0].type).toBe('note');
	});

	it('resolves TYPE value directly', () => {
		const config: YamlCalloutConfig = {
			DISPLAY: 'inline',
			ENTRIES: [{ LINE: 1, TEXT: 'test', TYPE: 'warning' }],
		};
		const result = resolveCalloutConfig(config, sampleCode, 3);
		expect(result.entries[0].type).toBe('warning');
	});

	it('normalizes TYPE aliases', () => {
		const config: YamlCalloutConfig = {
			DISPLAY: 'inline',
			ENTRIES: [{ LINE: 1, TEXT: 'test', TYPE: 'hint' }],
		};
		const result = resolveCalloutConfig(config, sampleCode, 3);
		expect(result.entries[0].type).toBe('tip');
	});

	it('normalizes TYPE case-insensitively', () => {
		const config: YamlCalloutConfig = {
			DISPLAY: 'inline',
			ENTRIES: [{ LINE: 1, TEXT: 'test', TYPE: 'WARNING' }],
		};
		const result = resolveCalloutConfig(config, sampleCode, 3);
		expect(result.entries[0].type).toBe('warning');
	});

	it('passes through unknown types as lowercase', () => {
		const config: YamlCalloutConfig = {
			DISPLAY: 'inline',
			ENTRIES: [{ LINE: 1, TEXT: 'test', TYPE: 'Custom' }],
		};
		const result = resolveCalloutConfig(config, sampleCode, 3);
		expect(result.entries[0].type).toBe('custom');
	});
});
