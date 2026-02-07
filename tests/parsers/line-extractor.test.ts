/**
 * Tests for src/parsers/line-extractor.ts
 *
 * Covers: extractBetweenMarkersWithOptions, extractBetweenMarkers,
 *         extractLines, parseLineSpec, extractLineRange, countLines,
 *         trimTrailingEmptyLines, applyFilterChain
 */

import { describe, it, expect } from 'vitest';
import {
	extractBetweenMarkersWithOptions,
	extractBetweenMarkers,
	extractLines,
	extractLineRange,
	countLines,
	trimTrailingEmptyLines,
	applyFilterChain,
	parseLineSpec,
} from '../../src/parsers/line-extractor';
import type { ResolvedBlockConfig, ResolvedFilterByLines, ResolvedFilterByMarks } from '../../src/types';

// =============================================================================
// Helpers
// =============================================================================

const SAMPLE_CODE = [
	'line 1',    // 1
	'line 2',    // 2
	'line 3',    // 3
	'// BEGIN',  // 4
	'',          // 5
	'code A',    // 6
	'code B',    // 7
	'',          // 8
	'// END',    // 9
	'line 10',   // 10
].join('\n');

/** Creates a minimal ResolvedBlockConfig with filter overrides. */
function testConfig(
	byLines?: Partial<ResolvedFilterByLines>,
	byMarks?: Partial<ResolvedFilterByMarks>,
): ResolvedBlockConfig {
	return {
		sourcePath: null,
		titleTemplate: '',
		descriptionText: '',
		titleBarStyle: 'tab',
		language: 'txt',
		foldLines: 0,
		scrollLines: 0,
		showZebraStripes: false,
		showLineNumbers: false,
		showCopyButton: true,
		shiftCopyJoin: '',
		altCopyJoin: '',
		joinIgnoreRegex: '',
		filterByLines: {
			enabled: false,
			start: 0,
			end: 0,
			inclusive: true,
			...byLines,
		},
		filterByMarks: {
			enabled: false,
			startMarker: '',
			endMarker: '',
			inclusive: false,
			...byMarks,
		},
	} as ResolvedBlockConfig;
}

// =============================================================================
// extractBetweenMarkersWithOptions
// =============================================================================

describe('extractBetweenMarkersWithOptions', () => {
	it('extracts content between markers (exclusive)', () => {
		const result = extractBetweenMarkersWithOptions(SAMPLE_CODE, '// BEGIN', '// END');
		expect(result.extractedContent).toBe('code A\ncode B');
		expect(result.errorMessage).toBeNull();
	});

	it('trims leading and trailing blank lines in exclusive mode', () => {
		const result = extractBetweenMarkersWithOptions(SAMPLE_CODE, '// BEGIN', '// END');
		// Lines 5 and 8 are blank, should be trimmed
		expect(result.extractedContent).toBe('code A\ncode B');
	});

	it('includes marker lines when inclusive', () => {
		const result = extractBetweenMarkersWithOptions(
			SAMPLE_CODE, '// BEGIN', '// END', { inclusive: true }
		);
		expect(result.extractedContent).toBe('// BEGIN\n\ncode A\ncode B\n\n// END');
	});

	it('does not trim blank lines in inclusive mode', () => {
		const result = extractBetweenMarkersWithOptions(
			SAMPLE_CODE, '// BEGIN', '// END', { inclusive: true }
		);
		// Blank lines adjacent to markers should be preserved
		expect(result.extractedContent).toContain('\n\ncode A');
	});

	it('returns error when start marker not found', () => {
		const result = extractBetweenMarkersWithOptions(SAMPLE_CODE, '// MISSING', '// END');
		expect(result.extractedContent).toBeNull();
		expect(result.errorMessage).toContain('Start marker');
	});

	it('returns error when end marker not found', () => {
		const result = extractBetweenMarkersWithOptions(SAMPLE_CODE, '// BEGIN', '// MISSING');
		expect(result.extractedContent).toBeNull();
		expect(result.errorMessage).toContain('End marker');
	});

	it('returns error for empty start marker', () => {
		const result = extractBetweenMarkersWithOptions(SAMPLE_CODE, '', '// END');
		expect(result.extractedContent).toBeNull();
		expect(result.errorMessage).toContain('non-empty');
	});

	it('returns error for empty end marker', () => {
		const result = extractBetweenMarkersWithOptions(SAMPLE_CODE, '// BEGIN', '');
		expect(result.extractedContent).toBeNull();
		expect(result.errorMessage).toContain('non-empty');
	});

	it('matches partial line content', () => {
		const code = 'foo BEGIN bar\ncontent\nfoo END bar';
		const result = extractBetweenMarkersWithOptions(code, 'BEGIN', 'END');
		expect(result.extractedContent).toBe('content');
	});

	it('returns empty string when markers are adjacent', () => {
		const code = '// BEGIN\n// END';
		const result = extractBetweenMarkersWithOptions(code, '// BEGIN', '// END');
		expect(result.extractedContent).toBe('');
	});

	it('finds first occurrence of start and nearest end after it', () => {
		const code = '// BEGIN\nfirst\n// END\n// BEGIN\nsecond\n// END';
		const result = extractBetweenMarkersWithOptions(code, '// BEGIN', '// END');
		expect(result.extractedContent).toBe('first');
	});
});

// =============================================================================
// extractBetweenMarkers (legacy)
// =============================================================================

describe('extractBetweenMarkers', () => {
	it('parses comma-separated markers', () => {
		const result = extractBetweenMarkers(SAMPLE_CODE, '// BEGIN, // END');
		expect(result.extractedContent).toBe('code A\ncode B');
	});

	it('returns error for empty spec', () => {
		const result = extractBetweenMarkers(SAMPLE_CODE, '');
		expect(result.errorMessage).toContain('No markers');
	});

	it('returns error for whitespace-only spec', () => {
		const result = extractBetweenMarkers(SAMPLE_CODE, '   ');
		expect(result.errorMessage).toContain('No markers');
	});

	it('returns error for single marker (no comma)', () => {
		const result = extractBetweenMarkers(SAMPLE_CODE, '// BEGIN');
		expect(result.errorMessage).toContain('start and end marker');
	});

	it('trims whitespace around markers', () => {
		const result = extractBetweenMarkers(SAMPLE_CODE, '  // BEGIN  ,  // END  ');
		expect(result.extractedContent).toBe('code A\ncode B');
	});
});

// =============================================================================
// extractLines
// =============================================================================

describe('extractLines', () => {
	it('extracts a single line', () => {
		expect(extractLines(SAMPLE_CODE, '1')).toBe('line 1');
	});

	it('extracts multiple individual lines', () => {
		expect(extractLines(SAMPLE_CODE, '1,3')).toBe('line 1\n...\nline 3');
	});

	it('extracts a range of lines', () => {
		expect(extractLines(SAMPLE_CODE, '1-3')).toBe('line 1\nline 2\nline 3');
	});

	it('extracts mixed lines and ranges', () => {
		expect(extractLines(SAMPLE_CODE, '1,6-7,10')).toBe(
			'line 1\n...\ncode A\ncode B\n...\nline 10'
		);
	});

	it('adds "..." separator between non-contiguous sections', () => {
		const result = extractLines(SAMPLE_CODE, '1,10');
		expect(result).toContain('...');
	});

	it('does not add separator between contiguous lines', () => {
		const result = extractLines(SAMPLE_CODE, '1,2,3');
		expect(result).not.toContain('...');
	});

	it('deduplicates line numbers', () => {
		expect(extractLines(SAMPLE_CODE, '1,1,1')).toBe('line 1');
	});

	it('sorts line numbers', () => {
		expect(extractLines(SAMPLE_CODE, '3,1,2')).toBe('line 1\nline 2\nline 3');
	});

	it('returns full source for empty spec', () => {
		expect(extractLines(SAMPLE_CODE, '')).toBe(SAMPLE_CODE);
	});

	it('returns full source for whitespace-only spec', () => {
		expect(extractLines(SAMPLE_CODE, '  ')).toBe(SAMPLE_CODE);
	});

	it('ignores out-of-range line numbers', () => {
		expect(extractLines(SAMPLE_CODE, '999')).toBe('');
	});

	it('ignores zero and negative line numbers', () => {
		expect(extractLines(SAMPLE_CODE, '0,-1')).toBe('');
	});

	it('handles ranges with spaces around the dash', () => {
		expect(extractLines(SAMPLE_CODE, '1 - 3')).toBe('line 1\nline 2\nline 3');
	});

	it('handles ranges with spaces around commas', () => {
		expect(extractLines(SAMPLE_CODE, ' 1 , 3 ')).toBe('line 1\n...\nline 3');
	});

	it('ignores invalid non-numeric parts', () => {
		expect(extractLines(SAMPLE_CODE, 'abc,1')).toBe('line 1');
	});
});

// =============================================================================
// parseLineSpec
// =============================================================================

describe('parseLineSpec', () => {
	it('parses a single line number', () => {
		expect(parseLineSpec('5')).toEqual([5]);
	});

	it('parses comma-separated line numbers', () => {
		expect(parseLineSpec('1,5,10')).toEqual([1, 5, 10]);
	});

	it('expands a range', () => {
		expect(parseLineSpec('3-6')).toEqual([3, 4, 5, 6]);
	});

	it('parses mixed lines and ranges', () => {
		expect(parseLineSpec('1,5-7,10')).toEqual([1, 5, 6, 7, 10]);
	});

	it('trims whitespace around parts', () => {
		expect(parseLineSpec(' 1 , 3 ')).toEqual([1, 3]);
	});

	it('trims whitespace around range dash', () => {
		expect(parseLineSpec('1 - 3')).toEqual([1, 2, 3]);
	});

	it('returns empty array for non-numeric input', () => {
		expect(parseLineSpec('abc')).toEqual([]);
	});

	it('skips invalid parts but keeps valid ones', () => {
		expect(parseLineSpec('abc,3,xyz')).toEqual([3]);
	});

	it('returns empty array for empty string', () => {
		expect(parseLineSpec('')).toEqual([]);
	});

	it('ignores reversed ranges (start > end)', () => {
		expect(parseLineSpec('5-3')).toEqual([]);
	});

	it('handles single-line range (start == end)', () => {
		expect(parseLineSpec('5-5')).toEqual([5]);
	});
});

// =============================================================================
// extractLineRange
// =============================================================================

describe('extractLineRange', () => {
	it('extracts inclusive range (default)', () => {
		expect(extractLineRange(SAMPLE_CODE, 1, 3)).toBe('line 1\nline 2\nline 3');
	});

	it('extracts exclusive range', () => {
		expect(extractLineRange(SAMPLE_CODE, 1, 3, { inclusive: false })).toBe('line 2');
	});

	it('extracts single line when start equals end (inclusive)', () => {
		expect(extractLineRange(SAMPLE_CODE, 6, 6)).toBe('code A');
	});

	it('returns empty string when exclusive range collapses', () => {
		// Lines 1-2 exclusive = only content between 1 and 2 = nothing valid
		expect(extractLineRange(SAMPLE_CODE, 1, 2, { inclusive: false })).toBe('');
	});

	it('clamps start to first line', () => {
		expect(extractLineRange(SAMPLE_CODE, -5, 2)).toBe('line 1\nline 2');
	});

	it('clamps end to last line', () => {
		const result = extractLineRange(SAMPLE_CODE, 9, 999);
		expect(result).toBe('// END\nline 10');
	});

	it('returns empty string for invalid range (start > end)', () => {
		expect(extractLineRange(SAMPLE_CODE, 5, 3)).toBe('');
	});

	it('extracts full file when range covers all lines', () => {
		expect(extractLineRange(SAMPLE_CODE, 1, 10)).toBe(SAMPLE_CODE);
	});
});

// =============================================================================
// countLines
// =============================================================================

describe('countLines', () => {
	it('counts lines in multiline content', () => {
		expect(countLines('a\nb\nc')).toBe(3);
	});

	it('counts single line', () => {
		expect(countLines('hello')).toBe(1);
	});

	it('returns 0 for empty string', () => {
		expect(countLines('')).toBe(0);
	});

	it('counts trailing newline as extra line', () => {
		expect(countLines('a\nb\n')).toBe(3);
	});
});

// =============================================================================
// trimTrailingEmptyLines
// =============================================================================

describe('trimTrailingEmptyLines', () => {
	it('removes trailing empty strings', () => {
		expect(trimTrailingEmptyLines(['a', 'b', '', ''])).toEqual(['a', 'b']);
	});

	it('does not remove leading empty strings', () => {
		expect(trimTrailingEmptyLines(['', 'a', 'b'])).toEqual(['', 'a', 'b']);
	});

	it('removes all items if all empty', () => {
		expect(trimTrailingEmptyLines(['', '', ''])).toEqual([]);
	});

	it('returns empty array for empty input', () => {
		expect(trimTrailingEmptyLines([])).toEqual([]);
	});

	it('does not modify array with no trailing empties', () => {
		expect(trimTrailingEmptyLines(['a', 'b'])).toEqual(['a', 'b']);
	});

	it('does not mutate the original array', () => {
		const original = ['a', 'b', ''];
		trimTrailingEmptyLines(original);
		expect(original).toEqual(['a', 'b', '']);
	});

	it('only trims exact empty strings (not whitespace)', () => {
		expect(trimTrailingEmptyLines(['a', '  '])).toEqual(['a', '  ']);
	});
});

// =============================================================================
// applyFilterChain
// =============================================================================

describe('applyFilterChain', () => {
	it('returns original content when no filters enabled', () => {
		const config = testConfig();
		const result = applyFilterChain(SAMPLE_CODE, config);
		expect(result.content).toBe(SAMPLE_CODE);
		expect(result.error).toBeNull();
	});

	it('applies BY_LINES filter only', () => {
		const config = testConfig({ enabled: true, start: 1, end: 3, inclusive: true });
		const result = applyFilterChain(SAMPLE_CODE, config);
		expect(result.content).toBe('line 1\nline 2\nline 3');
		expect(result.error).toBeNull();
	});

	it('applies BY_MARKS filter only', () => {
		const config = testConfig(undefined, {
			enabled: true, startMarker: '// BEGIN', endMarker: '// END', inclusive: false,
		});
		const result = applyFilterChain(SAMPLE_CODE, config);
		expect(result.content).toBe('code A\ncode B');
		expect(result.error).toBeNull();
	});

	it('applies BY_LINES then BY_MARKS in sequence', () => {
		// First extract lines 4-9, then find markers within that
		const config = testConfig(
			{ enabled: true, start: 4, end: 9, inclusive: true },
			{ enabled: true, startMarker: '// BEGIN', endMarker: '// END', inclusive: false },
		);
		const result = applyFilterChain(SAMPLE_CODE, config);
		expect(result.content).toBe('code A\ncode B');
		expect(result.error).toBeNull();
	});

	it('returns error when BY_MARKS markers not found', () => {
		const config = testConfig(undefined, {
			enabled: true, startMarker: '// MISSING', endMarker: '// END', inclusive: false,
		});
		const result = applyFilterChain(SAMPLE_CODE, config);
		expect(result.error).toContain('Start marker');
		expect(result.content).toBe('');
	});

	it('returns error when BY_MARKS markers not in BY_LINES range', () => {
		// Lines 1-3 don't contain the markers
		const config = testConfig(
			{ enabled: true, start: 1, end: 3, inclusive: true },
			{ enabled: true, startMarker: '// BEGIN', endMarker: '// END', inclusive: false },
		);
		const result = applyFilterChain(SAMPLE_CODE, config);
		expect(result.error).not.toBeNull();
	});

	it('supports inclusive marker extraction in filter chain', () => {
		const config = testConfig(undefined, {
			enabled: true, startMarker: '// BEGIN', endMarker: '// END', inclusive: true,
		});
		const result = applyFilterChain(SAMPLE_CODE, config);
		expect(result.content).toContain('// BEGIN');
		expect(result.content).toContain('// END');
	});
});
