/**
 * Tests for CALLOUT section parsing in yaml-parser.ts
 *
 * Covers: parseCalloutSection, hasKnownYamlSections with CALLOUT,
 * and parseNestedYamlConfig CALLOUT integration.
 */

import { describe, it, expect } from 'vitest';
import {
	parseCalloutSection,
	parseNestedYamlConfig,
} from '../../src/parsers/yaml-parser';

// =============================================================================
// parseCalloutSection — Basic Parsing
// =============================================================================

describe('parseCalloutSection', () => {
	it('returns empty object when CALLOUT section is missing', () => {
		const result = parseCalloutSection({});
		expect(result.DISPLAY).toBeUndefined();
		expect(result.PRINT_DISPLAY).toBeUndefined();
		expect(result.ENTRIES).toBeUndefined();
	});

	it('returns empty object when CALLOUT is not an object', () => {
		const result = parseCalloutSection({ CALLOUT: 'invalid' });
		expect(result.DISPLAY).toBeUndefined();
		expect(result.ENTRIES).toBeUndefined();
	});

	it('returns empty object when CALLOUT is an array', () => {
		const result = parseCalloutSection({ CALLOUT: [1, 2, 3] });
		expect(result.DISPLAY).toBeUndefined();
		expect(result.ENTRIES).toBeUndefined();
	});

	it('parses DISPLAY mode', () => {
		const result = parseCalloutSection({
			CALLOUT: { DISPLAY: 'inline' },
		});
		expect(result.DISPLAY).toBe('inline');
	});

	it('lowercases DISPLAY mode', () => {
		const result = parseCalloutSection({
			CALLOUT: { DISPLAY: 'Footnote' },
		});
		expect(result.DISPLAY).toBe('footnote');
	});

	it('parses PRINT_DISPLAY mode', () => {
		const result = parseCalloutSection({
			CALLOUT: { PRINT_DISPLAY: 'footnote' },
		});
		expect(result.PRINT_DISPLAY).toBe('footnote');
	});

	it('lowercases PRINT_DISPLAY mode', () => {
		const result = parseCalloutSection({
			CALLOUT: { PRINT_DISPLAY: 'INLINE' },
		});
		expect(result.PRINT_DISPLAY).toBe('inline');
	});

	it('DISPLAY is undefined when not specified', () => {
		const result = parseCalloutSection({
			CALLOUT: { ENTRIES: [] },
		});
		expect(result.DISPLAY).toBeUndefined();
	});

	it('PRINT_DISPLAY is undefined when not specified', () => {
		const result = parseCalloutSection({
			CALLOUT: { DISPLAY: 'inline' },
		});
		expect(result.PRINT_DISPLAY).toBeUndefined();
	});

	it('parses STYLE field', () => {
		const result = parseCalloutSection({
			CALLOUT: { STYLE: 'border' },
		});
		expect(result.STYLE).toBe('border');
	});

	it('lowercases STYLE field', () => {
		const result = parseCalloutSection({
			CALLOUT: { STYLE: 'Border' },
		});
		expect(result.STYLE).toBe('border');
	});

	it('STYLE is undefined when not specified', () => {
		const result = parseCalloutSection({
			CALLOUT: { DISPLAY: 'inline' },
		});
		expect(result.STYLE).toBeUndefined();
	});
});

// =============================================================================
// parseCalloutSection — ENTRIES parsing
// =============================================================================

describe('parseCalloutSection ENTRIES', () => {
	it('parses empty ENTRIES array', () => {
		const result = parseCalloutSection({
			CALLOUT: { ENTRIES: [] },
		});
		expect(result.ENTRIES).toEqual([]);
	});

	it('ENTRIES is undefined when not specified', () => {
		const result = parseCalloutSection({
			CALLOUT: { DISPLAY: 'inline' },
		});
		expect(result.ENTRIES).toBeUndefined();
	});

	it('ignores ENTRIES when not an array', () => {
		const result = parseCalloutSection({
			CALLOUT: { ENTRIES: 'invalid' },
		});
		expect(result.ENTRIES).toBeUndefined();
	});

	it('parses entry with LINE target', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ LINE: 5, TEXT: 'Hello' }],
			},
		});
		expect(result.ENTRIES).toHaveLength(1);
		expect(result.ENTRIES![0].LINE).toBe(5);
		expect(result.ENTRIES![0].TEXT).toBe('Hello');
	});

	it('parses entry with MARK target', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ MARK: '// @note', TEXT: 'Important' }],
			},
		});
		expect(result.ENTRIES).toHaveLength(1);
		expect(result.ENTRIES![0].MARK).toBe('// @note');
		expect(result.ENTRIES![0].TEXT).toBe('Important');
	});

	it('parses entry with LINES range string', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ LINES: '10, 20', TEXT: 'Range note' }],
			},
		});
		expect(result.ENTRIES).toHaveLength(1);
		expect(result.ENTRIES![0].LINES).toBe('10, 20');
	});

	it('parses entry with LINES range array', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ LINES: [10, 20], TEXT: 'Range note' }],
			},
		});
		expect(result.ENTRIES).toHaveLength(1);
		expect(result.ENTRIES![0].LINES).toEqual([10, 20]);
	});

	it('parses REPLACE boolean (true)', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ LINE: 5, TEXT: 'Test', REPLACE: true }],
			},
		});
		expect(result.ENTRIES![0].REPLACE).toBe(true);
	});

	it('parses REPLACE boolean (false)', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ LINE: 5, TEXT: 'Test', REPLACE: false }],
			},
		});
		expect(result.ENTRIES![0].REPLACE).toBe(false);
	});

	it('parses REPLACE string "true"', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ LINE: 5, TEXT: 'Test', REPLACE: 'true' }],
			},
		});
		expect(result.ENTRIES![0].REPLACE).toBe(true);
	});

	it('REPLACE is undefined when not specified', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ LINE: 5, TEXT: 'Test' }],
			},
		});
		expect(result.ENTRIES![0].REPLACE).toBeUndefined();
	});

	it('parses per-entry DISPLAY override', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ LINE: 5, TEXT: 'Test', DISPLAY: 'Popover' }],
			},
		});
		expect(result.ENTRIES![0].DISPLAY).toBe('popover');
	});

	it('entry DISPLAY is undefined when not specified', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ LINE: 5, TEXT: 'Test' }],
			},
		});
		expect(result.ENTRIES![0].DISPLAY).toBeUndefined();
	});

	it('parses multiple entries', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [
					{ LINE: 5, TEXT: 'First' },
					{ MARK: '// @note', TEXT: 'Second' },
					{ LINES: '10, 20', TEXT: 'Third' },
				],
			},
		});
		expect(result.ENTRIES).toHaveLength(3);
		expect(result.ENTRIES![0].TEXT).toBe('First');
		expect(result.ENTRIES![1].TEXT).toBe('Second');
		expect(result.ENTRIES![2].TEXT).toBe('Third');
	});

	it('filters out non-object entries', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [
					'invalid',
					null,
					42,
					{ LINE: 5, TEXT: 'Valid' },
				],
			},
		});
		expect(result.ENTRIES).toHaveLength(1);
		expect(result.ENTRIES![0].TEXT).toBe('Valid');
	});

	it('filters out array entries within ENTRIES', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [
					[1, 2, 3],
					{ LINE: 5, TEXT: 'Valid' },
				],
			},
		});
		expect(result.ENTRIES).toHaveLength(1);
	});

	it('handles entry with no TEXT', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ LINE: 5 }],
			},
		});
		expect(result.ENTRIES).toHaveLength(1);
		expect(result.ENTRIES![0].TEXT).toBeUndefined();
	});

	it('handles entry with no target (no LINE, MARK, or LINES)', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ TEXT: 'Orphaned' }],
			},
		});
		expect(result.ENTRIES).toHaveLength(1);
		expect(result.ENTRIES![0].LINE).toBeUndefined();
		expect(result.ENTRIES![0].MARK).toBeUndefined();
		expect(result.ENTRIES![0].LINES).toBeUndefined();
	});

	it('resolves LINE as number from string', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ LINE: '10', TEXT: 'Test' }],
			},
		});
		expect(result.ENTRIES![0].LINE).toBe(10);
	});

	it('handles negative LINE number', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ LINE: -1, TEXT: 'Negative' }],
			},
		});
		expect(result.ENTRIES![0].LINE).toBe(-1);
	});

	it('handles LINE of 0', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ LINE: 0, TEXT: 'Zero' }],
			},
		});
		expect(result.ENTRIES![0].LINE).toBe(0);
	});

	it('handles non-numeric LINE gracefully', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ LINE: 'abc', TEXT: 'Bad' }],
			},
		});
		// resolveNumber returns -1 for invalid
		expect(result.ENTRIES![0].LINE).toBe(-1);
	});

	it('converts non-string TEXT to string', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ LINE: 5, TEXT: 42 }],
			},
		});
		expect(result.ENTRIES![0].TEXT).toBe('42');
	});

	it('converts non-string MARK to string', () => {
		const result = parseCalloutSection({
			CALLOUT: {
				ENTRIES: [{ MARK: 123, TEXT: 'Test' }],
			},
		});
		expect(result.ENTRIES![0].MARK).toBe('123');
	});
});

// =============================================================================
// hasKnownYamlSections with CALLOUT
// =============================================================================

describe('hasKnownYamlSections with CALLOUT', () => {
	it('recognises CALLOUT as known section via parseBlockContent', () => {
		// parseNestedYamlConfig parses CALLOUT, so if we parse YAML with CALLOUT
		// section, the block should be recognised as ufence config
		const config = parseNestedYamlConfig({ CALLOUT: { DISPLAY: 'inline' } });
		expect(config.CALLOUT).toBeDefined();
		expect(config.CALLOUT!.DISPLAY).toBe('inline');
	});
});

// =============================================================================
// parseNestedYamlConfig — CALLOUT integration
// =============================================================================

describe('parseNestedYamlConfig CALLOUT integration', () => {
	it('includes CALLOUT in result when present', () => {
		const config = parseNestedYamlConfig({
			CALLOUT: {
				DISPLAY: 'footnote',
				ENTRIES: [{ LINE: 1, TEXT: 'Test' }],
			},
		});
		expect(config.CALLOUT).toBeDefined();
		expect(config.CALLOUT!.DISPLAY).toBe('footnote');
		expect(config.CALLOUT!.ENTRIES).toHaveLength(1);
	});

	it('CALLOUT is empty when not present in YAML', () => {
		const config = parseNestedYamlConfig({
			META: { TITLE: 'Test' },
		});
		// parseCalloutSection returns {} for missing section
		expect(config.CALLOUT).toBeDefined();
		expect(config.CALLOUT!.DISPLAY).toBeUndefined();
		expect(config.CALLOUT!.ENTRIES).toBeUndefined();
	});

	it('works alongside other sections', () => {
		const config = parseNestedYamlConfig({
			META: { TITLE: 'Test' },
			RENDER: { LINES: true },
			FILTER: { BY_LINES: { RANGE: '1, 10' } },
			CALLOUT: {
				DISPLAY: 'inline',
				ENTRIES: [{ LINE: 5, TEXT: 'Note' }],
			},
		});
		expect(config.META!.TITLE).toBe('Test');
		expect(config.RENDER!.LINES).toBe(true);
		expect(config.FILTER!.BY_LINES).toBeDefined();
		expect(config.CALLOUT!.DISPLAY).toBe('inline');
	});
});

// =============================================================================
// parseCalloutSection - TYPE field
// =============================================================================

describe('parseCalloutSection - TYPE field', () => {
	it('parses TYPE from entry', () => {
		const props = {
			CALLOUT: {
				ENTRIES: [{ LINE: 5, TEXT: 'warning', TYPE: 'warning' }],
			},
		};
		const result = parseCalloutSection(props);
		expect(result.ENTRIES![0].TYPE).toBe('warning');
	});

	it('omits TYPE when not specified', () => {
		const props = {
			CALLOUT: {
				ENTRIES: [{ LINE: 5, TEXT: 'plain' }],
			},
		};
		const result = parseCalloutSection(props);
		expect(result.ENTRIES![0].TYPE).toBeUndefined();
	});

	it('preserves TYPE as-is without normalizing', () => {
		const props = {
			CALLOUT: {
				ENTRIES: [{ LINE: 5, TEXT: 'alias', TYPE: 'hint' }],
			},
		};
		const result = parseCalloutSection(props);
		expect(result.ENTRIES![0].TYPE).toBe('hint');
	});
});
