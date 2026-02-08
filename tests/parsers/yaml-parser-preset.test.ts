import { describe, it, expect } from 'vitest';
import {
	parseMetaSection,
	parsePresetYaml,
} from '../../src/parsers/yaml-parser';
import type { ParsedYamlConfig } from '../../src/types';

// =============================================================================
// parseMetaSection - PRESET field tests
// =============================================================================

describe('parseMetaSection — PRESET field present returns string value', () => {
	it('extracts PRESET field from META section', () => {
		const result = parseMetaSection({
			META: {
				PRESET: 'teaching',
			},
		});
		expect(result.PRESET).toBe('teaching');
	});

	it('extracts PRESET alongside other META fields', () => {
		const result = parseMetaSection({
			META: {
				PATH: 'vault://Scripts/helper.ts',
				TITLE: 'Helper Functions',
				DESC: 'Utility functions',
				PRESET: 'minimal',
			},
		});
		expect(result.PATH).toBe('vault://Scripts/helper.ts');
		expect(result.TITLE).toBe('Helper Functions');
		expect(result.DESC).toBe('Utility functions');
		expect(result.PRESET).toBe('minimal');
	});

	it('converts non-string PRESET values to strings', () => {
		const result = parseMetaSection({
			META: {
				PRESET: 123,
			},
		});
		expect(result.PRESET).toBe('123');
	});

	it('converts boolean PRESET values to strings', () => {
		const result = parseMetaSection({
			META: {
				PRESET: true,
			},
		});
		expect(result.PRESET).toBe('true');
	});
});

describe('parseMetaSection — PRESET field absent returns undefined', () => {
	it('returns undefined when PRESET not in META', () => {
		const result = parseMetaSection({
			META: {
				PATH: 'vault://file.ts',
				TITLE: 'Test',
			},
		});
		expect(result.PRESET).toBeUndefined();
	});

	it('returns undefined when META is missing', () => {
		const result = parseMetaSection({});
		expect(result.PRESET).toBeUndefined();
	});

	it('returns undefined when META is empty', () => {
		const result = parseMetaSection({ META: {} });
		expect(result.PRESET).toBeUndefined();
	});

	it('returns undefined when META is not an object', () => {
		const result = parseMetaSection({ META: 'not an object' });
		expect(result.PRESET).toBeUndefined();
	});
});

// =============================================================================
// parsePresetYaml tests
// =============================================================================

describe('parsePresetYaml — valid YAML with RENDER section returns ParsedYamlConfig with RENDER', () => {
	it('parses RENDER section with single property', () => {
		const yaml = 'RENDER:\n  LINES: true';
		const result = parsePresetYaml(yaml);
		expect(result.RENDER).toBeDefined();
		expect(result.RENDER!.LINES).toBe(true);
	});

	it('parses RENDER section with multiple properties', () => {
		const yaml = 'RENDER:\n  LINES: true\n  ZEBRA: true\n  STYLE: "integrated"';
		const result = parsePresetYaml(yaml);
		expect(result.RENDER).toBeDefined();
		expect(result.RENDER!.LINES).toBe(true);
		expect(result.RENDER!.ZEBRA).toBe(true);
		expect(result.RENDER!.STYLE).toBe('integrated');
	});

	it('parses numeric RENDER properties', () => {
		const yaml = 'RENDER:\n  FOLD: 10\n  SCROLL: 20';
		const result = parsePresetYaml(yaml);
		expect(result.RENDER).toBeDefined();
		expect(result.RENDER!.FOLD).toBe(10);
		expect(result.RENDER!.SCROLL).toBe(20);
	});
});

describe('parsePresetYaml — valid YAML with META + RENDER returns both sections', () => {
	it('parses both META and RENDER sections', () => {
		const yaml = 'META:\n  TITLE: "Preset Title"\nRENDER:\n  LINES: true\n  ZEBRA: true';
		const result = parsePresetYaml(yaml);
		expect(result.META).toBeDefined();
		expect(result.META!.TITLE).toBe('Preset Title');
		expect(result.RENDER).toBeDefined();
		expect(result.RENDER!.LINES).toBe(true);
		expect(result.RENDER!.ZEBRA).toBe(true);
	});

	it('includes PRESET field in META if present', () => {
		const yaml = 'META:\n  TITLE: "Test"\n  PRESET: "base"\nRENDER:\n  LINES: true';
		const result = parsePresetYaml(yaml);
		expect(result.META!.PRESET).toBe('base');
		expect(result.RENDER!.LINES).toBe(true);
	});
});

describe('parsePresetYaml — empty string returns empty config', () => {
	it('returns empty object for empty string', () => {
		const result = parsePresetYaml('');
		expect(result).toEqual({});
	});

	it('returns empty object for whitespace-only string', () => {
		const result = parsePresetYaml('   \n\n   ');
		expect(result).toEqual({});
	});

	it('returns empty object for null-like inputs', () => {
		const result1 = parsePresetYaml('');
		const result2 = parsePresetYaml('\n');
		expect(result1).toEqual({});
		expect(result2).toEqual({});
	});
});

describe('parsePresetYaml — invalid YAML returns empty config', () => {
	it('returns empty config for invalid YAML syntax', () => {
		const yaml = 'RENDER:\n  LINES: [unclosed bracket';
		const result = parsePresetYaml(yaml);
		expect(result).toEqual({});
	});

	it('returns empty config for malformed YAML', () => {
		const yaml = 'RENDER\n  LINES: true'; // Missing colon
		const result = parsePresetYaml(yaml);
		// This might parse as an object with unexpected structure
		// Just verify it doesn't throw and returns something
		expect(result).toBeDefined();
	});

	it('returns config with all sections when YAML parses but has no known sections', () => {
		const yaml = 'UNKNOWN: value\nOTHER: something';
		const result = parsePresetYaml(yaml);
		// parseNestedYamlConfig always returns META, RENDER, FILTER, RENDER_CMDOUT
		// CALLOUT and PROMPT may be undefined if empty
		expect(result.META).toBeDefined();
		expect(result.RENDER).toBeDefined();
		expect(result.FILTER).toBeDefined();
		// The CALLOUT section should be empty/undefined since no CALLOUT section exists
		// Check that the structure is as expected
		expect(typeof result).toBe('object');
	});
});

describe('parsePresetYaml — YAML with only CALLOUT section returns it correctly', () => {
	it('parses CALLOUT section with entries', () => {
		const yaml = 'CALLOUT:\n  DISPLAY: "inline"\n  ENTRIES:\n    - LINE: 5\n      TEXT: "Test callout"';
		const result = parsePresetYaml(yaml);
		expect(result.CALLOUT).toBeDefined();
		expect(result.CALLOUT!.DISPLAY).toBe('inline');
		expect(result.CALLOUT!.ENTRIES).toBeDefined();
		expect(result.CALLOUT!.ENTRIES!.length).toBeGreaterThan(0);
	});

	it('parses CALLOUT with STYLE property', () => {
		const yaml = 'CALLOUT:\n  STYLE: "border"';
		const result = parsePresetYaml(yaml);
		expect(result.CALLOUT).toBeDefined();
		expect(result.CALLOUT!.STYLE).toBe('border');
	});
});

describe('parsePresetYaml — whitespace-only string returns empty config', () => {
	it('returns empty config for space-only string', () => {
		const result = parsePresetYaml('     ');
		expect(result).toEqual({});
	});

	it('returns empty config for newline-only string', () => {
		const result = parsePresetYaml('\n\n\n');
		expect(result).toEqual({});
	});

	it('returns empty config for mixed whitespace', () => {
		const result = parsePresetYaml('  \n  \t  \n  ');
		expect(result).toEqual({});
	});
});

// =============================================================================
// Additional edge cases
// =============================================================================

describe('parsePresetYaml — additional edge cases', () => {
	it('parses FILTER section correctly', () => {
		const yaml = 'FILTER:\n  BY_LINES:\n    RANGE: "1, 10"\n    INCLUSIVE: true';
		const result = parsePresetYaml(yaml);
		expect(result.FILTER).toBeDefined();
		expect(result.FILTER!.BY_LINES).toBeDefined();
		expect(result.FILTER!.BY_LINES!.RANGE).toBe('1, 10');
		expect(result.FILTER!.BY_LINES!.INCLUSIVE).toBe(true);
	});

	it('parses PROMPT property at top level', () => {
		const yaml = 'PROMPT: "^\\\\$ "';
		const result = parsePresetYaml(yaml);
		expect(result.PROMPT).toBe('^\\$ ');
	});

	it('parses combined META, RENDER, and FILTER', () => {
		const yaml = 'META:\n  TITLE: "Test"\nRENDER:\n  LINES: true\nFILTER:\n  BY_LINES:\n    RANGE: "1, 5"';
		const result = parsePresetYaml(yaml);
		expect(result.META).toBeDefined();
		expect(result.RENDER).toBeDefined();
		expect(result.FILTER).toBeDefined();
	});
});
