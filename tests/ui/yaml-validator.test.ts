/**
 * Tests for the YAML schema validator.
 */

import { describe, it, expect } from 'vitest';
import { validateYamlSchema, formatWarnings } from '../../src/ui/yaml-validator';

describe('validateYamlSchema', () => {
	// =================================================================
	// Empty / non-object input
	// =================================================================

	it('returns empty for null', () => {
		expect(validateYamlSchema(null)).toEqual([]);
	});

	it('returns empty for undefined', () => {
		expect(validateYamlSchema(undefined)).toEqual([]);
	});

	it('returns empty for a string', () => {
		expect(validateYamlSchema('hello')).toEqual([]);
	});

	it('returns empty for an array', () => {
		expect(validateYamlSchema([1, 2])).toEqual([]);
	});

	it('returns empty for empty object', () => {
		expect(validateYamlSchema({})).toEqual([]);
	});

	// =================================================================
	// Valid top-level sections
	// =================================================================

	it('accepts all valid top-level sections', () => {
		const parsed = {
			META: { TITLE: 'test' },
			RENDER: { LINES: true },
			FILTER: { BY_LINES: { RANGE: '1, 10' } },
			CALLOUT: { DISPLAY: 'inline' },
		};
		expect(validateYamlSchema(parsed)).toEqual([]);
	});

	it('accepts META with all valid keys', () => {
		const parsed = {
			META: { PATH: 'vault://x', TITLE: 'test', DESC: 'hello', PRESET: 'teaching' },
		};
		expect(validateYamlSchema(parsed)).toEqual([]);
	});

	it('accepts RENDER with all valid keys', () => {
		const parsed = {
			RENDER: {
				FOLD: 20, SCROLL: 10, ZEBRA: true, LINES: true,
				COPY: true, STYLE: 'integrated', LANG: 'python',
				SHIFT_COPY_JOIN: '&&', ALT_COPY_JOIN: ';',
				CMD_COPY_JOIN: ';', JOIN_IGNORE_REGEX: '^#', PRINT: 'expand',
			},
		};
		expect(validateYamlSchema(parsed)).toEqual([]);
	});

	// =================================================================
	// Invalid top-level keys
	// =================================================================

	it('flags unknown top-level keys', () => {
		const parsed = { RENDER: { LINES: true }, NUMBER: true, ZEBRA: true };
		const warnings = validateYamlSchema(parsed);
		expect(warnings).toHaveLength(2);
		expect(warnings[0].path).toBe('NUMBER');
		expect(warnings[1].path).toBe('ZEBRA');
	});

	it('flags a single unknown top-level key', () => {
		const parsed = { SETTINGS: {} };
		const warnings = validateYamlSchema(parsed);
		expect(warnings).toHaveLength(1);
		expect(warnings[0].key).toBe('SETTINGS');
	});

	// =================================================================
	// Invalid section keys
	// =================================================================

	it('flags unknown META keys', () => {
		const parsed = { META: { TITLE: 'test', AUTHOR: 'me' } };
		const warnings = validateYamlSchema(parsed);
		expect(warnings).toHaveLength(1);
		expect(warnings[0].path).toBe('META.AUTHOR');
	});

	it('flags unknown RENDER keys', () => {
		const parsed = { RENDER: { LINES: true, NUMBER: true } };
		const warnings = validateYamlSchema(parsed);
		expect(warnings).toHaveLength(1);
		expect(warnings[0].path).toBe('RENDER.NUMBER');
		expect(warnings[0].key).toBe('NUMBER');
	});

	it('flags unknown FILTER keys', () => {
		const parsed = { FILTER: { BY_LINES: { RANGE: '1,10' }, BY_REGEX: {} } };
		const warnings = validateYamlSchema(parsed);
		expect(warnings).toHaveLength(1);
		expect(warnings[0].path).toBe('FILTER.BY_REGEX');
	});

	it('flags unknown CALLOUT keys', () => {
		const parsed = { CALLOUT: { DISPLAY: 'inline', COLOR: '#ff0000' } };
		const warnings = validateYamlSchema(parsed);
		expect(warnings).toHaveLength(1);
		expect(warnings[0].path).toBe('CALLOUT.COLOR');
	});

	// =================================================================
	// Nested FILTER validation
	// =================================================================

	it('accepts valid BY_LINES keys', () => {
		const parsed = { FILTER: { BY_LINES: { RANGE: '1, 10', INCLUSIVE: true } } };
		expect(validateYamlSchema(parsed)).toEqual([]);
	});

	it('flags unknown BY_LINES keys', () => {
		const parsed = { FILTER: { BY_LINES: { RANGE: '1, 10', OFFSET: 5 } } };
		const warnings = validateYamlSchema(parsed);
		expect(warnings).toHaveLength(1);
		expect(warnings[0].path).toBe('FILTER.BY_LINES.OFFSET');
	});

	it('accepts valid BY_MARKS keys', () => {
		const parsed = { FILTER: { BY_MARKS: { START: '// BEGIN', END: '// END', INCLUSIVE: false } } };
		expect(validateYamlSchema(parsed)).toEqual([]);
	});

	it('flags unknown BY_MARKS keys', () => {
		const parsed = { FILTER: { BY_MARKS: { START: '// BEGIN', PATTERN: '.*' } } };
		const warnings = validateYamlSchema(parsed);
		expect(warnings).toHaveLength(1);
		expect(warnings[0].path).toBe('FILTER.BY_MARKS.PATTERN');
	});

	// =================================================================
	// CALLOUT.ENTRIES validation
	// =================================================================

	it('accepts valid CALLOUT.ENTRIES items', () => {
		const parsed = {
			CALLOUT: {
				ENTRIES: [
					{ LINE: 3, TEXT: 'hello', TYPE: 'info', DISPLAY: 'inline' },
					{ MARK: 'lru_cache', TEXT: 'memo', REPLACE: true },
					{ LINES: [3, 5], TEXT: 'range' },
				],
			},
		};
		expect(validateYamlSchema(parsed)).toEqual([]);
	});

	it('flags unknown CALLOUT.ENTRIES keys', () => {
		const parsed = {
			CALLOUT: {
				ENTRIES: [
					{ LINE: 3, TEXT: 'hello', COLOR: 'red' },
				],
			},
		};
		const warnings = validateYamlSchema(parsed);
		expect(warnings).toHaveLength(1);
		expect(warnings[0].path).toBe('CALLOUT.ENTRIES[0].COLOR');
	});

	it('flags multiple unknown entry keys across entries', () => {
		const parsed = {
			CALLOUT: {
				ENTRIES: [
					{ LINE: 3, TEXT: 'hello', FONT: 'bold' },
					{ MARK: 'x', TEXT: 'y', ICON: 'star' },
				],
			},
		};
		const warnings = validateYamlSchema(parsed);
		expect(warnings).toHaveLength(2);
		expect(warnings[0].path).toBe('CALLOUT.ENTRIES[0].FONT');
		expect(warnings[1].path).toBe('CALLOUT.ENTRIES[1].ICON');
	});

	// =================================================================
	// Multiple errors at once
	// =================================================================

	it('catches multiple errors across sections', () => {
		const parsed = {
			META: { TITLE: 'test', AUTHOR: 'me' },
			RENDER: { NUMBER: true, HIGHLIGHT: [1, 2] },
			UNKNOWN_SECTION: {},
		};
		const warnings = validateYamlSchema(parsed);
		expect(warnings).toHaveLength(4);
		const paths = warnings.map(w => w.path);
		expect(paths).toContain('META.AUTHOR');
		expect(paths).toContain('RENDER.NUMBER');
		expect(paths).toContain('RENDER.HIGHLIGHT');
		expect(paths).toContain('UNKNOWN_SECTION');
	});

	// =================================================================
	// Non-object sections are skipped gracefully
	// =================================================================

	it('skips validation for non-object section values', () => {
		const parsed = { META: 'not an object', RENDER: 42 };
		// META and RENDER are valid section names, but their values aren't objects
		// — this is a structural issue the YAML validator handles, not the schema checker
		expect(validateYamlSchema(parsed)).toEqual([]);
	});
});

describe('formatWarnings', () => {
	it('returns empty string for no warnings', () => {
		expect(formatWarnings([])).toBe('');
	});

	it('formats a single warning', () => {
		expect(formatWarnings([{ path: 'RENDER.NUMBER', key: 'NUMBER' }]))
			.toBe('Unknown key: RENDER.NUMBER');
	});

	it('formats multiple warnings', () => {
		const result = formatWarnings([
			{ path: 'NUMBER', key: 'NUMBER' },
			{ path: 'ZEBRA', key: 'ZEBRA' },
		]);
		expect(result).toBe('Unknown keys: NUMBER, ZEBRA');
	});
});
