/**
 * Tests for src/utils/template.ts
 *
 * Covers: containsTemplateVariables, replaceTemplateVariables
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	containsTemplateVariables,
	replaceTemplateVariables,
} from '../../src/utils/template';
import type { SourceFileMetadata } from '../../src/types';

// =============================================================================
// Helper
// =============================================================================

function testMetadata(overrides?: Partial<SourceFileMetadata>): SourceFileMetadata {
	return {
		filename: 'helper.ts',
		basename: 'helper',
		extension: 'ts',
		fullPath: 'src/utils/helper.ts',
		parentFolder: 'src/utils',
		modifiedTime: Date.UTC(2025, 5, 15, 12, 0, 0),
		createdTime: Date.UTC(2025, 0, 1, 0, 0, 0),
		sizeInBytes: 2560,
		...overrides,
	};
}

// =============================================================================
// containsTemplateVariables
// =============================================================================

describe('containsTemplateVariables', () => {
	it('returns true for strings with template braces', () => {
		expect(containsTemplateVariables('{filename}')).toBe(true);
	});

	it('returns true for strings with multiple variables', () => {
		expect(containsTemplateVariables('{basename} - {size}')).toBe(true);
	});

	it('returns false for plain text', () => {
		expect(containsTemplateVariables('plain text')).toBe(false);
	});

	it('returns false for empty string', () => {
		expect(containsTemplateVariables('')).toBe(false);
	});

	it('returns true even for a lone opening brace', () => {
		// The implementation checks for '{' only
		expect(containsTemplateVariables('{')).toBe(true);
	});
});

// =============================================================================
// replaceTemplateVariables — text fields
// =============================================================================

describe('replaceTemplateVariables — text fields', () => {
	const meta = testMetadata();

	it('replaces {filename}', () => {
		expect(replaceTemplateVariables('{filename}', meta)).toBe('helper.ts');
	});

	it('replaces {basename}', () => {
		expect(replaceTemplateVariables('{basename}', meta)).toBe('helper');
	});

	it('replaces {extension}', () => {
		expect(replaceTemplateVariables('{extension}', meta)).toBe('ts');
	});

	it('replaces {fullpath}', () => {
		expect(replaceTemplateVariables('{fullpath}', meta)).toBe('src/utils/helper.ts');
	});

	it('replaces {parentfolder}', () => {
		expect(replaceTemplateVariables('{parentfolder}', meta)).toBe('src/utils');
	});

	it('applies upper case format', () => {
		expect(replaceTemplateVariables('{filename:upper}', meta)).toBe('HELPER.TS');
	});

	it('applies lower case format', () => {
		expect(replaceTemplateVariables('{filename:lower}', meta)).toBe('helper.ts');
	});

	it('applies title case format', () => {
		expect(replaceTemplateVariables('{basename:title}', meta)).toBe('Helper');
	});

	it('applies capitalise format', () => {
		expect(replaceTemplateVariables('{extension:capitalise}', meta)).toBe('Ts');
	});

	it('is case-insensitive for variable names', () => {
		expect(replaceTemplateVariables('{FILENAME}', meta)).toBe('helper.ts');
		expect(replaceTemplateVariables('{FileName}', meta)).toBe('helper.ts');
	});
});

// =============================================================================
// replaceTemplateVariables — size field
// =============================================================================

describe('replaceTemplateVariables — size field', () => {
	const meta = testMetadata({ sizeInBytes: 2560 });

	it('replaces {size} with auto format', () => {
		expect(replaceTemplateVariables('{size}', meta)).toBe('2.5 KB');
	});

	it('replaces {size:bytes}', () => {
		expect(replaceTemplateVariables('{size:bytes}', meta)).toBe('2560 B');
	});

	it('replaces {size:kb}', () => {
		expect(replaceTemplateVariables('{size:kb}', meta)).toBe('2.5 KB');
	});

	it('replaces {size:mb}', () => {
		expect(replaceTemplateVariables('{size:mb}', meta)).toBe('0.00 MB');
	});

	it('returns empty string when sizeInBytes is undefined', () => {
		const noSize = testMetadata({ sizeInBytes: undefined });
		expect(replaceTemplateVariables('{size}', noSize)).toBe('');
	});
});

// =============================================================================
// replaceTemplateVariables — date fields
// =============================================================================

describe('replaceTemplateVariables — date fields', () => {
	const meta = testMetadata();

	it('replaces {modified:iso}', () => {
		expect(replaceTemplateVariables('{modified:iso}', meta)).toBe('2025-06-15T12:00:00');
	});

	it('replaces {created:iso}', () => {
		expect(replaceTemplateVariables('{created:iso}', meta)).toBe('2025-01-01T00:00:00');
	});

	it('replaces {modified:relative} with a relative string', () => {
		const recentMeta = testMetadata({ modifiedTime: Date.now() - 3600000 });
		vi.spyOn(Date, 'now').mockReturnValue(recentMeta.modifiedTime! + 3600000);
		expect(replaceTemplateVariables('{modified:relative}', recentMeta)).toBe('1 hour ago');
	});

	it('returns empty string when modifiedTime is undefined', () => {
		const noMod = testMetadata({ modifiedTime: undefined });
		expect(replaceTemplateVariables('{modified}', noMod)).toBe('');
	});

	it('returns empty string when createdTime is undefined', () => {
		const noCreate = testMetadata({ createdTime: undefined });
		expect(replaceTemplateVariables('{created}', noCreate)).toBe('');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});
});

// =============================================================================
// replaceTemplateVariables — mixed & edge cases
// =============================================================================

describe('replaceTemplateVariables — mixed & edge cases', () => {
	const meta = testMetadata();

	it('replaces multiple variables in one string', () => {
		expect(replaceTemplateVariables('{basename} - {size:kb}', meta)).toBe('helper - 2.5 KB');
	});

	it('preserves literal text around variables', () => {
		expect(replaceTemplateVariables('File: {filename} ({size})', meta)).toBe(
			'File: helper.ts (2.5 KB)'
		);
	});

	it('preserves unknown variables as-is', () => {
		expect(replaceTemplateVariables('{unknownvar}', meta)).toBe('{unknownvar}');
	});

	it('preserves unknown variables with format as-is', () => {
		expect(replaceTemplateVariables('{unknownvar:fmt}', meta)).toBe('{unknownvar:fmt}');
	});

	it('returns string unchanged when no variables present', () => {
		expect(replaceTemplateVariables('no variables here', meta)).toBe('no variables here');
	});

	it('handles empty template string', () => {
		expect(replaceTemplateVariables('', meta)).toBe('');
	});
});
