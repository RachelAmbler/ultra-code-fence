/**
 * Tests for src/utils/config-merge.ts
 *
 * Covers: deepMergeYamlConfigs
 */

import { describe, it, expect } from 'vitest';
import { deepMergeYamlConfigs } from '../../src/utils/config-merge';
import type { ParsedYamlConfig } from '../../src/types';

// =============================================================================
// Test 1: Both empty → returns empty config
// =============================================================================

describe('deepMergeYamlConfigs — empty configs', () => {
	it('returns empty config when both base and override are empty', () => {
		const base: ParsedYamlConfig = {};
		const override: ParsedYamlConfig = {};

		const result = deepMergeYamlConfigs(base, override);

		expect(result).toEqual({});
	});

	it('handles undefined base gracefully', () => {
		const override: ParsedYamlConfig = { META: { TITLE: 'Test' } };

		const result = deepMergeYamlConfigs({}, override);

		expect(result).toEqual({ META: { TITLE: 'Test' } });
	});

	it('handles undefined override gracefully', () => {
		const base: ParsedYamlConfig = { META: { TITLE: 'Test' } };

		const result = deepMergeYamlConfigs(base, {});

		expect(result).toEqual({ META: { TITLE: 'Test' } });
	});
});

// =============================================================================
// Test 2: Base has values, override is empty → returns base values
// =============================================================================

describe('deepMergeYamlConfigs — base has values, override empty', () => {
	it('returns base values when override is empty', () => {
		const base: ParsedYamlConfig = {
			META: { TITLE: 'Base Title', PATH: '/base/path' },
			RENDER: { FOLD: 10 },
		};
		const override: ParsedYamlConfig = {};

		const result = deepMergeYamlConfigs(base, override);

		expect(result).toEqual(base);
	});

	it('preserves all base sections when override is empty', () => {
		const base: ParsedYamlConfig = {
			META: { TITLE: 'Title' },
			RENDER: { FOLD: 5 },
			FILTER: { BY_LINES: { RANGE: '1,10' } },
			CALLOUT: { DISPLAY: 'inline' },
			PROMPT: 'pattern',
			RENDER_CMDOUT: { PROMPT: { COLOUR: 'red' } },
		};
		const override: ParsedYamlConfig = {};

		const result = deepMergeYamlConfigs(base, override);

		expect(result).toEqual(base);
	});
});

// =============================================================================
// Test 3: Override has values, base is empty → returns override values
// =============================================================================

describe('deepMergeYamlConfigs — override has values, base empty', () => {
	it('returns override values when base is empty', () => {
		const base: ParsedYamlConfig = {};
		const override: ParsedYamlConfig = {
			META: { TITLE: 'Override Title', PATH: '/override/path' },
			RENDER: { SCROLL: 20 },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result).toEqual(override);
	});

	it('preserves all override sections when base is empty', () => {
		const base: ParsedYamlConfig = {};
		const override: ParsedYamlConfig = {
			META: { TITLE: 'Title' },
			RENDER: { FOLD: 5 },
			FILTER: { BY_MARKS: { START: 'BEGIN', END: 'END' } },
			CALLOUT: { DISPLAY: 'footnote' },
			PROMPT: 'prompt_pattern',
			RENDER_CMDOUT: { COMMAND: { BOLD: true } },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result).toEqual(override);
	});
});

// =============================================================================
// Test 4: Override values replace base values (META.TITLE)
// =============================================================================

describe('deepMergeYamlConfigs — override replaces base', () => {
	it('overrides META.TITLE from base', () => {
		const base: ParsedYamlConfig = {
			META: { TITLE: 'Base Title' },
		};
		const override: ParsedYamlConfig = {
			META: { TITLE: 'Override Title' },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.META?.TITLE).toBe('Override Title');
	});

	it('overrides RENDER.FOLD from base', () => {
		const base: ParsedYamlConfig = {
			RENDER: { FOLD: 10 },
		};
		const override: ParsedYamlConfig = {
			RENDER: { FOLD: 20 },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.RENDER?.FOLD).toBe(20);
	});

	it('overrides multiple RENDER properties', () => {
		const base: ParsedYamlConfig = {
			RENDER: { FOLD: 10, SCROLL: 5, ZEBRA: false },
		};
		const override: ParsedYamlConfig = {
			RENDER: { FOLD: 20, ZEBRA: true },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.RENDER).toEqual({ FOLD: 20, SCROLL: 5, ZEBRA: true });
	});

	it('overrides top-level PROMPT', () => {
		const base: ParsedYamlConfig = {
			PROMPT: 'base_pattern',
		};
		const override: ParsedYamlConfig = {
			PROMPT: 'override_pattern',
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.PROMPT).toBe('override_pattern');
	});
});

// =============================================================================
// Test 5: Undefined override values fall through to base
// =============================================================================

describe('deepMergeYamlConfigs — undefined override falls through', () => {
	it('preserves base META properties when override META lacks them', () => {
		const base: ParsedYamlConfig = {
			META: { TITLE: 'Base Title', PATH: '/base/path', DESC: 'Description' },
		};
		const override: ParsedYamlConfig = {
			META: { PATH: '/override/path' },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.META).toEqual({
			TITLE: 'Base Title',
			PATH: '/override/path',
			DESC: 'Description',
		});
	});

	it('preserves base RENDER properties when override RENDER lacks them', () => {
		const base: ParsedYamlConfig = {
			RENDER: { FOLD: 10, SCROLL: 5, LINES: true },
		};
		const override: ParsedYamlConfig = {
			RENDER: { FOLD: 20 },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.RENDER).toEqual({
			FOLD: 20,
			SCROLL: 5,
			LINES: true,
		});
	});

	it('falls through to base when override META is undefined', () => {
		const base: ParsedYamlConfig = {
			META: { TITLE: 'Base Title' },
		};
		const override: ParsedYamlConfig = {
			RENDER: { FOLD: 10 },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.META).toEqual({ TITLE: 'Base Title' });
		expect(result.RENDER).toEqual({ FOLD: 10 });
	});
});

// =============================================================================
// Test 6: RENDER section merges independently from META
// =============================================================================

describe('deepMergeYamlConfigs — independent section merging', () => {
	it('merges RENDER and META independently', () => {
		const base: ParsedYamlConfig = {
			META: { TITLE: 'Base Title', PATH: '/base' },
			RENDER: { FOLD: 10, SCROLL: 5 },
		};
		const override: ParsedYamlConfig = {
			META: { DESC: 'Override Desc' },
			RENDER: { FOLD: 20 },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.META).toEqual({
			TITLE: 'Base Title',
			PATH: '/base',
			DESC: 'Override Desc',
		});
		expect(result.RENDER).toEqual({
			FOLD: 20,
			SCROLL: 5,
		});
	});

	it('handles sections present in override but not in base', () => {
		const base: ParsedYamlConfig = {
			META: { TITLE: 'Title' },
		};
		const override: ParsedYamlConfig = {
			RENDER: { FOLD: 10 },
			FILTER: { BY_LINES: { RANGE: '1,5' } },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.META).toEqual({ TITLE: 'Title' });
		expect(result.RENDER).toEqual({ FOLD: 10 });
		expect(result.FILTER).toEqual({ BY_LINES: { RANGE: '1,5' } });
	});
});

// =============================================================================
// Test 7: CALLOUT.ENTRIES from override replaces base ENTRIES entirely
// =============================================================================

describe('deepMergeYamlConfigs — CALLOUT.ENTRIES replacement', () => {
	it('replaces base ENTRIES when override has ENTRIES', () => {
		const baseEntries = [
			{ LINE: 1, TEXT: 'Base callout 1' },
			{ LINE: 2, TEXT: 'Base callout 2' },
		];
		const overrideEntries = [{ LINE: 5, TEXT: 'Override callout' }];

		const base: ParsedYamlConfig = {
			CALLOUT: { ENTRIES: baseEntries },
		};
		const override: ParsedYamlConfig = {
			CALLOUT: { ENTRIES: overrideEntries },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.CALLOUT?.ENTRIES).toEqual(overrideEntries);
		expect(result.CALLOUT?.ENTRIES).not.toContainEqual({
			LINE: 1,
			TEXT: 'Base callout 1',
		});
	});

	it('preserves base ENTRIES when override does not have ENTRIES', () => {
		const baseEntries = [
			{ LINE: 1, TEXT: 'Base callout' },
		];

		const base: ParsedYamlConfig = {
			CALLOUT: { ENTRIES: baseEntries, DISPLAY: 'inline' },
		};
		const override: ParsedYamlConfig = {
			CALLOUT: { DISPLAY: 'footnote' },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.CALLOUT?.ENTRIES).toEqual(baseEntries);
		expect(result.CALLOUT?.DISPLAY).toBe('footnote');
	});
});

// =============================================================================
// Test 8: CALLOUT.DISPLAY from override replaces base DISPLAY
// =============================================================================

describe('deepMergeYamlConfigs — CALLOUT.DISPLAY override', () => {
	it('overrides CALLOUT.DISPLAY', () => {
		const base: ParsedYamlConfig = {
			CALLOUT: { DISPLAY: 'inline' },
		};
		const override: ParsedYamlConfig = {
			CALLOUT: { DISPLAY: 'popover' },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.CALLOUT?.DISPLAY).toBe('popover');
	});

	it('overrides CALLOUT.PRINT_DISPLAY', () => {
		const base: ParsedYamlConfig = {
			CALLOUT: { PRINT_DISPLAY: 'inline' },
		};
		const override: ParsedYamlConfig = {
			CALLOUT: { PRINT_DISPLAY: 'footnote' },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.CALLOUT?.PRINT_DISPLAY).toBe('footnote');
	});

	it('overrides CALLOUT.STYLE', () => {
		const base: ParsedYamlConfig = {
			CALLOUT: { STYLE: 'standard' },
		};
		const override: ParsedYamlConfig = {
			CALLOUT: { STYLE: 'border' },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.CALLOUT?.STYLE).toBe('border');
	});
});

// =============================================================================
// Test 9: Base has ENTRIES + DISPLAY, override has only DISPLAY
// =============================================================================

describe('deepMergeYamlConfigs — CALLOUT partial merge', () => {
	it('preserves base ENTRIES when override has only DISPLAY', () => {
		const baseEntries = [
			{ LINE: 1, TEXT: 'Important' },
			{ MARK: 'TODO', TEXT: 'Do this' },
		];

		const base: ParsedYamlConfig = {
			CALLOUT: {
				ENTRIES: baseEntries,
				DISPLAY: 'inline',
				PRINT_DISPLAY: 'inline',
				STYLE: 'standard',
			},
		};
		const override: ParsedYamlConfig = {
			CALLOUT: { DISPLAY: 'footnote' },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.CALLOUT?.ENTRIES).toEqual(baseEntries);
		expect(result.CALLOUT?.DISPLAY).toBe('footnote');
		expect(result.CALLOUT?.PRINT_DISPLAY).toBe('inline');
		expect(result.CALLOUT?.STYLE).toBe('standard');
	});

	it('merges multiple CALLOUT properties correctly', () => {
		const base: ParsedYamlConfig = {
			CALLOUT: {
				DISPLAY: 'inline',
				PRINT_DISPLAY: 'inline',
				STYLE: 'standard',
				ENTRIES: [{ LINE: 1, TEXT: 'Base' }],
			},
		};
		const override: ParsedYamlConfig = {
			CALLOUT: {
				STYLE: 'border',
				PRINT_DISPLAY: 'footnote',
				ENTRIES: [{ LINE: 5, TEXT: 'Override' }],
			},
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.CALLOUT).toEqual({
			DISPLAY: 'inline',
			PRINT_DISPLAY: 'footnote',
			STYLE: 'border',
			ENTRIES: [{ LINE: 5, TEXT: 'Override' }],
		});
	});
});

// =============================================================================
// Test 10: FILTER.BY_LINES merges property-by-property
// =============================================================================

describe('deepMergeYamlConfigs — FILTER.BY_LINES merge', () => {
	it('merges BY_LINES properties independently', () => {
		const base: ParsedYamlConfig = {
			FILTER: {
				BY_LINES: { RANGE: '1,10', INCLUSIVE: true },
			},
		};
		const override: ParsedYamlConfig = {
			FILTER: {
				BY_LINES: { RANGE: '5,15' },
			},
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.FILTER?.BY_LINES).toEqual({
			RANGE: '5,15',
			INCLUSIVE: true,
		});
	});

	it('merges BY_MARKS independently from BY_LINES', () => {
		const base: ParsedYamlConfig = {
			FILTER: {
				BY_LINES: { RANGE: '1,10' },
				BY_MARKS: { START: 'BEGIN' },
			},
		};
		const override: ParsedYamlConfig = {
			FILTER: {
				BY_MARKS: { END: 'END' },
			},
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.FILTER?.BY_LINES).toEqual({ RANGE: '1,10' });
		expect(result.FILTER?.BY_MARKS).toEqual({
			START: 'BEGIN',
			END: 'END',
		});
	});

	it('handles case where override has BY_LINES but base does not', () => {
		const base: ParsedYamlConfig = {
			FILTER: {
				BY_MARKS: { START: 'BEGIN', END: 'END' },
			},
		};
		const override: ParsedYamlConfig = {
			FILTER: {
				BY_LINES: { RANGE: '1,5' },
			},
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.FILTER?.BY_LINES).toEqual({ RANGE: '1,5' });
		expect(result.FILTER?.BY_MARKS).toEqual({
			START: 'BEGIN',
			END: 'END',
		});
	});
});

// =============================================================================
// Test 11: PROMPT from override replaces base PROMPT
// =============================================================================

describe('deepMergeYamlConfigs — top-level PROMPT override', () => {
	it('overrides top-level PROMPT', () => {
		const base: ParsedYamlConfig = {
			PROMPT: '^\\$ ',
		};
		const override: ParsedYamlConfig = {
			PROMPT: '^> ',
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.PROMPT).toBe('^> ');
	});

	it('preserves base PROMPT when override does not have PROMPT', () => {
		const base: ParsedYamlConfig = {
			PROMPT: '^\\$ ',
		};
		const override: ParsedYamlConfig = {
			RENDER_CMDOUT: { PROMPT: { COLOUR: 'red' } },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.PROMPT).toBe('^\\$ ');
	});

	it('removes base PROMPT if override has undefined PROMPT', () => {
		const base: ParsedYamlConfig = {
			PROMPT: '^\\$ ',
		};
		const override: ParsedYamlConfig = {};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.PROMPT).toBe('^\\$ ');
	});
});

// =============================================================================
// Test 12: Full integration test
// =============================================================================

describe('deepMergeYamlConfigs — full integration', () => {
	it('merges complex nested structure correctly', () => {
		const base: ParsedYamlConfig = {
			META: { TITLE: 'Base Title', PATH: '/base/path' },
			RENDER: { FOLD: 10, SCROLL: 5, LINES: true, ZEBRA: false },
			FILTER: {
				BY_LINES: { RANGE: '1,20', INCLUSIVE: true },
				BY_MARKS: { START: 'BEGIN', END: 'END' },
			},
			CALLOUT: {
				DISPLAY: 'inline',
				PRINT_DISPLAY: 'inline',
				STYLE: 'standard',
				ENTRIES: [{ LINE: 5, TEXT: 'Important' }],
			},
			PROMPT: '^\\$ ',
			RENDER_CMDOUT: {
				PROMPT: { COLOUR: 'blue', BOLD: true },
				COMMAND: { COLOUR: 'green' },
			},
		};

		const override: ParsedYamlConfig = {
			META: { DESC: 'Override Description' },
			RENDER: { FOLD: 20, LINES: false },
			FILTER: {
				BY_LINES: { INCLUSIVE: false },
			},
			CALLOUT: {
				DISPLAY: 'footnote',
				ENTRIES: [{ LINE: 10, TEXT: 'Note' }],
			},
			RENDER_CMDOUT: {
				COMMAND: { BOLD: false },
				OUTPUT: { COLOUR: 'red' },
			},
		};

		const result = deepMergeYamlConfigs(base, override);

		// META should have both base and override properties
		expect(result.META).toEqual({
			TITLE: 'Base Title',
			PATH: '/base/path',
			DESC: 'Override Description',
		});

		// RENDER should merge override into base
		expect(result.RENDER).toEqual({
			FOLD: 20,
			SCROLL: 5,
			LINES: false,
			ZEBRA: false,
		});

		// FILTER should merge both BY_LINES and BY_MARKS
		expect(result.FILTER).toEqual({
			BY_LINES: { RANGE: '1,20', INCLUSIVE: false },
			BY_MARKS: { START: 'BEGIN', END: 'END' },
		});

		// CALLOUT should replace ENTRIES but preserve other properties
		expect(result.CALLOUT).toEqual({
			DISPLAY: 'footnote',
			PRINT_DISPLAY: 'inline',
			STYLE: 'standard',
			ENTRIES: [{ LINE: 10, TEXT: 'Note' }],
		});

		// Top-level PROMPT should remain from base (not overridden)
		expect(result.PROMPT).toBe('^\\$ ');

		// RENDER_CMDOUT should merge nested objects
		expect(result.RENDER_CMDOUT).toEqual({
			PROMPT: { COLOUR: 'blue', BOLD: true },
			COMMAND: { COLOUR: 'green', BOLD: false },
			OUTPUT: { COLOUR: 'red' },
		});
	});

	it('handles base with RENDER+CALLOUT, override with META+RENDER', () => {
		const base: ParsedYamlConfig = {
			RENDER: { FOLD: 10, SCROLL: 5, LINES: true },
			CALLOUT: { DISPLAY: 'inline', ENTRIES: [{ LINE: 1, TEXT: 'Base' }] },
		};

		const override: ParsedYamlConfig = {
			META: { TITLE: 'Override Title' },
			RENDER: { FOLD: 20 },
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.META).toEqual({ TITLE: 'Override Title' });
		expect(result.RENDER).toEqual({ FOLD: 20, SCROLL: 5, LINES: true });
		expect(result.CALLOUT).toEqual({
			DISPLAY: 'inline',
			ENTRIES: [{ LINE: 1, TEXT: 'Base' }],
		});
	});

	it('handles base with RENDER_CMDOUT nested objects', () => {
		const base: ParsedYamlConfig = {
			RENDER_CMDOUT: {
				PROMPT: { COLOUR: 'blue', BOLD: true, ITALIC: false },
				COMMAND: { COLOUR: 'green', BOLD: false },
				OUTPUT: { COLOUR: 'black' },
			},
		};

		const override: ParsedYamlConfig = {
			RENDER_CMDOUT: {
				PROMPT: { ITALIC: true },
				OUTPUT: { BOLD: true },
			},
		};

		const result = deepMergeYamlConfigs(base, override);

		expect(result.RENDER_CMDOUT).toEqual({
			PROMPT: { COLOUR: 'blue', BOLD: true, ITALIC: true },
			COMMAND: { COLOUR: 'green', BOLD: false },
			OUTPUT: { COLOUR: 'black', BOLD: true },
		});
	});
});
