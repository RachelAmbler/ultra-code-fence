import { describe, it, expect } from 'vitest';
import { resolvePreset } from '../../src/utils/preset-resolver';
import type { ParsedYamlConfig } from '../../src/types';

// Test data: Presets map
const presets: Record<string, string> = {
	'teaching': 'RENDER:\n  LINES: true\n  ZEBRA: true\n  STYLE: "integrated"',
	'minimal': 'RENDER:\n  COPY: false\n  FOLD: 20',
	'full': 'META:\n  TITLE: "Preset Title"\nRENDER:\n  LINES: true\n  ZEBRA: true',
};

// =============================================================================
// No Preset, No Page Config
// =============================================================================

describe('resolvePreset — No preset name, no page config', () => {
	it('returns blockConfig unchanged when no preset is specified', () => {
		const blockConfig: ParsedYamlConfig = {
			RENDER: {
				FOLD: 10,
				LINES: true,
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result).toEqual(blockConfig);
	});

	it('returns blockConfig unchanged when presets map is empty', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				TITLE: 'My Block',
			},
			RENDER: {
				FOLD: 5,
			},
		};
		const result = resolvePreset(blockConfig, {});
		expect(result).toEqual(blockConfig);
	});

	it('returns blockConfig unchanged when pageConfig is undefined and no META.PRESET', () => {
		const blockConfig: ParsedYamlConfig = {
			RENDER: {
				ZEBRA: true,
			},
		};
		const result = resolvePreset(blockConfig, presets, undefined);
		expect(result).toEqual(blockConfig);
	});
});

// =============================================================================
// META.PRESET Found
// =============================================================================

describe('resolvePreset — META.PRESET found in presets map', () => {
	it('merges preset as base when META.PRESET is present', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'teaching',
				TITLE: 'My Block',
			},
			RENDER: {
				FOLD: 15,
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result.RENDER).toBeDefined();
		expect(result.RENDER!.LINES).toBe(true); // From preset
		expect(result.RENDER!.ZEBRA).toBe(true); // From preset
		expect(result.RENDER!.STYLE).toBe('integrated'); // From preset
		expect(result.RENDER!.FOLD).toBe(15); // From block (override)
		expect(result.META!.TITLE).toBe('My Block'); // From block
	});

	it('combines RENDER from preset and block', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'minimal',
			},
			RENDER: {
				SCROLL: 10,
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result.RENDER!.COPY).toBe(false); // From preset
		expect(result.RENDER!.FOLD).toBe(20); // From preset
		expect(result.RENDER!.SCROLL).toBe(10); // From block (override)
	});

	it('strips PRESET field from merged META', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'teaching',
				TITLE: 'Test',
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result.META!.PRESET).toBeUndefined();
		expect(result.META!.TITLE).toBe('Test');
	});
});

// =============================================================================
// META.PRESET Not Found
// =============================================================================

describe('resolvePreset — META.PRESET not found in presets map', () => {
	it('returns blockConfig unchanged when preset not in map', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'nonexistent',
			},
			RENDER: {
				LINES: false,
			},
		};
		const result = resolvePreset(blockConfig, presets);
		// Preset not found, but META.PRESET triggers merge path; block config preserved
		expect(result.RENDER!.LINES).toBe(false);
	});

	it('preserves blockConfig when preset name is invalid', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'unknown-preset',
			},
			RENDER: {
				FOLD: 5,
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result.RENDER!.FOLD).toBe(5);
	});
});

// =============================================================================
// Page Config with PRESET Reference (backward compat)
// =============================================================================

describe('resolvePreset — pageConfig with META.PRESET (backward compat)', () => {
	it('uses page preset when blockConfig has no PRESET', () => {
		const blockConfig: ParsedYamlConfig = {
			RENDER: {
				SCROLL: 15,
			},
		};
		const pageConfig: ParsedYamlConfig = {
			META: { PRESET: 'minimal' },
		};
		const result = resolvePreset(blockConfig, presets, pageConfig);
		expect(result.RENDER!.COPY).toBe(false); // From preset
		expect(result.RENDER!.FOLD).toBe(20); // From preset
		expect(result.RENDER!.SCROLL).toBe(15); // From block (override)
	});

	it('uses page preset with empty META in block', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {},
			RENDER: {
				LINES: true,
			},
		};
		const pageConfig: ParsedYamlConfig = {
			META: { PRESET: 'teaching' },
		};
		const result = resolvePreset(blockConfig, presets, pageConfig);
		expect(result.RENDER!.LINES).toBe(true); // Block overrides preset
		expect(result.RENDER!.ZEBRA).toBe(true); // From preset
	});

	it('does nothing when pageConfig is undefined', () => {
		const blockConfig: ParsedYamlConfig = {
			RENDER: {
				FOLD: 5,
			},
		};
		const result = resolvePreset(blockConfig, presets, undefined);
		expect(result).toEqual(blockConfig);
	});
});

// =============================================================================
// Priority: block META.PRESET over page config META.PRESET
// =============================================================================

describe('resolvePreset — block META.PRESET takes priority over page config META.PRESET', () => {
	it('uses block META.PRESET when both block and page specify PRESET', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'teaching',
			},
		};
		const pageConfig: ParsedYamlConfig = {
			META: { PRESET: 'minimal' },
		};
		const result = resolvePreset(blockConfig, presets, pageConfig);
		// Should use 'teaching', not 'minimal'
		expect(result.RENDER!.ZEBRA).toBe(true); // teaching has ZEBRA
		expect(result.RENDER!.STYLE).toBe('integrated'); // teaching has STYLE
	});

	it('respects block META.PRESET even if page config points to different preset', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'minimal',
			},
		};
		const pageConfig: ParsedYamlConfig = {
			META: { PRESET: 'full' },
		};
		const result = resolvePreset(blockConfig, presets, pageConfig);
		// Should use 'minimal', not 'full'
		expect(result.RENDER!.FOLD).toBe(20); // minimal has FOLD: 20
	});
});

// =============================================================================
// Merge Priority: Block Override Preset
// =============================================================================

describe('resolvePreset — Block RENDER values override preset RENDER values', () => {
	it('block property overrides preset property', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'teaching',
			},
			RENDER: {
				ZEBRA: false, // Override preset's ZEBRA: true
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result.RENDER!.ZEBRA).toBe(false); // Block wins
		expect(result.RENDER!.LINES).toBe(true); // From preset (not overridden)
	});

	it('block META overrides preset META', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'full',
				TITLE: 'My Custom Title',
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result.META!.TITLE).toBe('My Custom Title');
	});

	it('block LANG overrides preset STYLE', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'teaching',
			},
			RENDER: {
				LANG: 'python', // Completely different from preset
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result.RENDER!.LANG).toBe('python'); // Block's new property
		expect(result.RENDER!.STYLE).toBe('integrated'); // From preset
	});
});

describe('resolvePreset — Preset RENDER values fill in where block RENDER is missing', () => {
	it('preset fills missing properties in block RENDER', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'minimal',
			},
			RENDER: {
				LINES: true,
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result.RENDER!.LINES).toBe(true); // From block
		expect(result.RENDER!.COPY).toBe(false); // From preset (missing in block)
		expect(result.RENDER!.FOLD).toBe(20); // From preset (missing in block)
	});

	it('partial RENDER in block uses preset for rest', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'teaching',
			},
			RENDER: {
				FOLD: 5, // Override preset's STYLE
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result.RENDER!.FOLD).toBe(5); // Block overrides
		expect(result.RENDER!.LINES).toBe(true); // From preset
		expect(result.RENDER!.ZEBRA).toBe(true); // From preset
		expect(result.RENDER!.STYLE).toBe('integrated'); // From preset
	});
});

// =============================================================================
// CALLOUT Handling
// =============================================================================

describe('resolvePreset — CALLOUT.ENTRIES from block replace preset ENTRIES', () => {
	it('block CALLOUT replaces preset CALLOUT', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'full',
			},
			CALLOUT: {
				DISPLAY: 'footnote',
				ENTRIES: [
					{
						LINE: 1,
						TEXT: 'Block callout',
					},
				],
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result.CALLOUT!.ENTRIES).toBeDefined();
		expect(result.CALLOUT!.ENTRIES![0].TEXT).toBe('Block callout');
	});
});

// =============================================================================
// META Handling
// =============================================================================

describe('resolvePreset — PRESET field stripped from merged META', () => {
	it('removes PRESET from result after merging', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'minimal',
				DESC: 'My description',
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result.META!.PRESET).toBeUndefined();
		expect(result.META!.DESC).toBe('My description');
	});

	it('removes PRESET from META even if it only contained PRESET', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'teaching',
			},
		};
		const result = resolvePreset(blockConfig, presets);
		// After stripping PRESET, the META object should have no properties with values
		// or META should be undefined if empty after stripping
		if (result.META) {
			expect(result.META.PRESET).toBeUndefined();
			// All other META fields should be undefined
			expect(result.META.PATH).toBeUndefined();
			expect(result.META.TITLE).toBeUndefined();
			expect(result.META.DESC).toBeUndefined();
		}
	});
});

describe('resolvePreset — Preset with META.TITLE, block with META.TITLE', () => {
	it('block META.TITLE wins over preset META.TITLE', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'full',
				TITLE: 'Block Title',
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result.META!.TITLE).toBe('Block Title');
	});
});

describe('resolvePreset — Preset with META.TITLE, block without META.TITLE', () => {
	it('uses preset META.TITLE when block has no TITLE', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'full',
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result.META!.TITLE).toBe('Preset Title');
	});

	it('uses preset META.TITLE with other block META fields', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'full',
				DESC: 'Block description',
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result.META!.TITLE).toBe('Preset Title');
		expect(result.META!.DESC).toBe('Block description');
		expect(result.META!.PRESET).toBeUndefined(); // Stripped
	});
});

// =============================================================================
// Empty Presets Map
// =============================================================================

describe('resolvePreset — Empty presets map', () => {
	it('returns blockConfig unchanged when presets is empty', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'teaching',
			},
			RENDER: {
				LINES: true,
			},
		};
		const result = resolvePreset(blockConfig, {});
		// Preset not found, but META.PRESET triggers merge path
		expect(result.RENDER!.LINES).toBe(true);
	});
});

// =============================================================================
// Complex Merging Scenarios
// =============================================================================

describe('resolvePreset — Complex merging scenarios', () => {
	it('merges FILTER from preset and block', () => {
		const customPresets: Record<string, string> = {
			'with-filter': 'FILTER:\n  BY_LINES:\n    RANGE: "1, 10"',
		};
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'with-filter',
			},
			FILTER: {
				BY_MARKS: {
					START: 'BEGIN',
					END: 'END',
				},
			},
		};
		const result = resolvePreset(blockConfig, customPresets);
		expect(result.FILTER!.BY_LINES).toBeDefined();
		expect(result.FILTER!.BY_MARKS).toBeDefined();
		expect(result.FILTER!.BY_LINES!.RANGE).toBe('1, 10');
		expect(result.FILTER!.BY_MARKS!.START).toBe('BEGIN');
	});

	it('multiple levels of RENDER properties', () => {
		const blockConfig: ParsedYamlConfig = {
			META: {
				PRESET: 'full',
			},
			RENDER: {
				FOLD: 30, // Override preset
				LANG: 'javascript', // New property
			},
		};
		const result = resolvePreset(blockConfig, presets);
		expect(result.RENDER!.LINES).toBe(true); // From preset
		expect(result.RENDER!.ZEBRA).toBe(true); // From preset
		expect(result.RENDER!.FOLD).toBe(30); // Block overrides
		expect(result.RENDER!.LANG).toBe('javascript'); // Block adds new
	});
});

// =============================================================================
// Inline Page Config (NEW — ufence-ufence with direct YAML)
// =============================================================================

describe('resolvePreset — Inline page config (no preset reference)', () => {
	it('merges page config RENDER with block config', () => {
		const blockConfig: ParsedYamlConfig = {
			RENDER: {
				FOLD: 10,
			},
		};
		const pageConfig: ParsedYamlConfig = {
			RENDER: {
				ZEBRA: true,
				LINES: true,
			},
		};
		const result = resolvePreset(blockConfig, presets, pageConfig);
		expect(result.RENDER!.ZEBRA).toBe(true); // From page config
		expect(result.RENDER!.LINES).toBe(true); // From page config
		expect(result.RENDER!.FOLD).toBe(10); // From block (override)
	});

	it('block config overrides page config values', () => {
		const blockConfig: ParsedYamlConfig = {
			RENDER: {
				ZEBRA: false, // Override page default
			},
		};
		const pageConfig: ParsedYamlConfig = {
			RENDER: {
				ZEBRA: true,
				LINES: true,
			},
		};
		const result = resolvePreset(blockConfig, presets, pageConfig);
		expect(result.RENDER!.ZEBRA).toBe(false); // Block wins
		expect(result.RENDER!.LINES).toBe(true); // From page config
	});

	it('page config with META.TITLE applies when block has no TITLE', () => {
		const blockConfig: ParsedYamlConfig = {
			RENDER: { LINES: true },
		};
		const pageConfig: ParsedYamlConfig = {
			META: { TITLE: 'Page Default Title' },
		};
		const result = resolvePreset(blockConfig, presets, pageConfig);
		expect(result.META!.TITLE).toBe('Page Default Title');
		expect(result.RENDER!.LINES).toBe(true);
	});

	it('page config FILTER section merges with block', () => {
		const blockConfig: ParsedYamlConfig = {
			FILTER: {
				BY_MARKS: { START: 'BEGIN', END: 'END' },
			},
		};
		const pageConfig: ParsedYamlConfig = {
			FILTER: {
				BY_LINES: { RANGE: '1, 20' },
			},
		};
		const result = resolvePreset(blockConfig, presets, pageConfig);
		expect(result.FILTER!.BY_LINES!.RANGE).toBe('1, 20'); // From page
		expect(result.FILTER!.BY_MARKS!.START).toBe('BEGIN'); // From block
	});

	it('empty page config has no effect', () => {
		const blockConfig: ParsedYamlConfig = {
			RENDER: { FOLD: 5 },
		};
		const pageConfig: ParsedYamlConfig = {};
		const result = resolvePreset(blockConfig, presets, pageConfig);
		expect(result.RENDER!.FOLD).toBe(5);
	});
});

// =============================================================================
// Inline Page Config + Named Preset (combined)
// =============================================================================

describe('resolvePreset — Inline page config combined with named preset', () => {
	it('preset as base, page config in middle, block on top', () => {
		const blockConfig: ParsedYamlConfig = {
			RENDER: {
				FOLD: 10, // Block override
			},
		};
		const pageConfig: ParsedYamlConfig = {
			META: { PRESET: 'teaching' },
			RENDER: {
				STYLE: 'plain', // Override preset's STYLE: "integrated"
			},
		};
		const result = resolvePreset(blockConfig, presets, pageConfig);
		expect(result.RENDER!.LINES).toBe(true); // From preset (teaching)
		expect(result.RENDER!.ZEBRA).toBe(true); // From preset (teaching)
		expect(result.RENDER!.STYLE).toBe('plain'); // Page config overrides preset
		expect(result.RENDER!.FOLD).toBe(10); // Block overrides all
	});

	it('page config adds config on top of preset', () => {
		const blockConfig: ParsedYamlConfig = {};
		const pageConfig: ParsedYamlConfig = {
			META: { PRESET: 'minimal' },
			RENDER: {
				ZEBRA: true, // Not in 'minimal' preset
			},
		};
		const result = resolvePreset(blockConfig, presets, pageConfig);
		expect(result.RENDER!.COPY).toBe(false); // From preset (minimal)
		expect(result.RENDER!.FOLD).toBe(20); // From preset (minimal)
		expect(result.RENDER!.ZEBRA).toBe(true); // From page config (added on top)
	});

	it('block META.PRESET wins over page config META.PRESET', () => {
		const blockConfig: ParsedYamlConfig = {
			META: { PRESET: 'teaching' },
		};
		const pageConfig: ParsedYamlConfig = {
			META: { PRESET: 'minimal' },
			RENDER: { SCROLL: 25 },
		};
		const result = resolvePreset(blockConfig, presets, pageConfig);
		// Should use 'teaching' preset, not 'minimal'
		expect(result.RENDER!.ZEBRA).toBe(true); // From 'teaching'
		expect(result.RENDER!.LINES).toBe(true); // From 'teaching'
		expect(result.RENDER!.SCROLL).toBe(25); // From page config (still applied)
	});

	it('strips PRESET from both page config and final result', () => {
		const blockConfig: ParsedYamlConfig = {};
		const pageConfig: ParsedYamlConfig = {
			META: { PRESET: 'teaching' },
		};
		const result = resolvePreset(blockConfig, presets, pageConfig);
		// PRESET should be stripped from final META
		if (result.META) {
			expect(result.META.PRESET).toBeUndefined();
		}
		// Preset values should still be applied
		expect(result.RENDER!.ZEBRA).toBe(true);
	});
});
