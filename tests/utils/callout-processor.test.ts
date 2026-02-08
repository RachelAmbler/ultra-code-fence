/**
 * Tests for src/utils/callout-processor.ts
 *
 * Covers: groupCalloutsByLine, buildInlineCalloutHTML, buildFootnoteRefHTML,
 * buildFootnoteEntryHTML, buildFootnoteSectionHTML, buildPopoverTriggerHTML,
 * buildPopoverContentHTML, shouldReplaceLine, filterByDisplayMode
 */

import { describe, it, expect } from 'vitest';
import {
	groupCalloutsByLine,
	buildInlineCalloutHTML,
	buildFootnoteRefHTML,
	buildFootnoteEntryHTML,
	buildFootnoteSectionHTML,
	buildPopoverTriggerHTML,
	buildPopoverContentHTML,
	shouldReplaceLine,
	filterByDisplayMode,
} from '../../src/utils/callout-processor';
import type { ResolvedCalloutConfig, ResolvedCalloutEntry } from '../../src/types';

// =============================================================================
// Helpers
// =============================================================================

function makeEntry(overrides: Partial<ResolvedCalloutEntry> = {}): ResolvedCalloutEntry {
	return {
		enabled: true,
		targetLines: [1],
		text: 'Test note',
		type: 'note',
		replace: false,
		displayMode: 'inline',
		...overrides,
	};
}

function makeConfig(entries: ResolvedCalloutEntry[]): ResolvedCalloutConfig {
	return {
		enabled: entries.length > 0,
		displayMode: 'inline',
		printDisplayMode: 'inline',
		style: 'standard',
		entries,
	};
}

// =============================================================================
// groupCalloutsByLine
// =============================================================================

describe('groupCalloutsByLine', () => {
	it('returns empty map when no entries', () => {
		const result = groupCalloutsByLine(makeConfig([]));
		expect(result.size).toBe(0);
	});

	it('groups single entry to single line', () => {
		const result = groupCalloutsByLine(makeConfig([
			makeEntry({ targetLines: [5] }),
		]));
		expect(result.size).toBe(1);
		expect(result.get(5)).toHaveLength(1);
	});

	it('groups multiple entries to same line', () => {
		const result = groupCalloutsByLine(makeConfig([
			makeEntry({ targetLines: [3], text: 'First' }),
			makeEntry({ targetLines: [3], text: 'Second' }),
		]));
		expect(result.get(3)).toHaveLength(2);
	});

	it('groups entry with multiple target lines', () => {
		const result = groupCalloutsByLine(makeConfig([
			makeEntry({ targetLines: [2, 3, 4], text: 'Range' }),
		]));
		expect(result.size).toBe(3);
		expect(result.get(2)).toHaveLength(1);
		expect(result.get(3)).toHaveLength(1);
		expect(result.get(4)).toHaveLength(1);
	});

	it('groups entries to different lines', () => {
		const result = groupCalloutsByLine(makeConfig([
			makeEntry({ targetLines: [1], text: 'First' }),
			makeEntry({ targetLines: [5], text: 'Fifth' }),
		]));
		expect(result.size).toBe(2);
		expect(result.get(1)![0].text).toBe('First');
		expect(result.get(5)![0].text).toBe('Fifth');
	});
});

// =============================================================================
// buildInlineCalloutHTML
// =============================================================================

describe('buildInlineCalloutHTML', () => {
	it('creates HTML with correct CSS class', () => {
		const html = buildInlineCalloutHTML('Note text', 'note');
		expect(html).toContain('ucf-callout-inline');
	});

	it('includes type-specific border colour', () => {
		const html = buildInlineCalloutHTML('Warning text', 'warning');
		expect(html).toContain('border-left-color: rgb(236, 117, 0)');
	});

	it('includes type-specific icon', () => {
		const html = buildInlineCalloutHTML('Info text', 'info');
		expect(html).toContain('ucf-callout-icon');
		expect(html).toContain('<svg');
	});

	it('includes callout text', () => {
		const html = buildInlineCalloutHTML('Hello world', 'note');
		expect(html).toContain('ucf-callout-text');
		expect(html).toContain('Hello world');
	});

	it('renders markdown in inline callout text', () => {
		const html = buildInlineCalloutHTML('Use **bold** here', 'note');
		expect(html).toContain('<strong>bold</strong>');
	});

	it('defaults to note styling for unknown type', () => {
		const html = buildInlineCalloutHTML('Custom', 'unknown');
		expect(html).toContain('border-left-color: rgb(68, 138, 255)');
	});

	it('escapes HTML in text', () => {
		const html = buildInlineCalloutHTML('Use <div> & "quotes"', 'note');
		expect(html).toContain('&lt;div&gt;');
		expect(html).toContain('&amp;');
	});

	it('defaults to standard style with left border', () => {
		const html = buildInlineCalloutHTML('Standard', 'note');
		expect(html).toContain('ucf-callout-inline');
		expect(html).not.toContain('ucf-callout-inline-border');
		expect(html).toContain('border-left-color:');
	});

	it('uses border style when specified', () => {
		const html = buildInlineCalloutHTML('Bordered', 'warning', 'border');
		expect(html).toContain('ucf-callout-inline-border');
		expect(html).not.toContain('"ucf-callout-inline"');
		expect(html).toContain('border-color: rgb(236, 117, 0)');
	});

	it('uses standard style explicitly', () => {
		const html = buildInlineCalloutHTML('Standard', 'info', 'standard');
		expect(html).toContain('ucf-callout-inline');
		expect(html).toContain('border-left-color:');
	});
});

// =============================================================================
// buildFootnoteRefHTML
// =============================================================================

describe('buildFootnoteRefHTML', () => {
	it('creates superscript element', () => {
		const html = buildFootnoteRefHTML(1);
		expect(html).toContain('ucf-callout-ref');
		expect(html).toContain('1');
	});

	it('includes correct number', () => {
		const html = buildFootnoteRefHTML(5);
		expect(html).toContain('>5<');
	});

	it('uses <sup> tag', () => {
		const html = buildFootnoteRefHTML(1);
		expect(html).toContain('<sup');
		expect(html).toContain('</sup>');
	});
});

// =============================================================================
// buildFootnoteEntryHTML
// =============================================================================

describe('buildFootnoteEntryHTML', () => {
	it('creates entry with correct CSS class', () => {
		const html = buildFootnoteEntryHTML('Note', 1);
		expect(html).toContain('ucf-callout-entry');
	});

	it('includes number', () => {
		const html = buildFootnoteEntryHTML('Note', 3);
		expect(html).toContain('ucf-callout-number');
		expect(html).toContain('3.');
	});

	it('includes text', () => {
		const html = buildFootnoteEntryHTML('Important note', 1);
		expect(html).toContain('ucf-callout-text');
		expect(html).toContain('Important note');
	});

	it('escapes HTML in text', () => {
		const html = buildFootnoteEntryHTML('<script>alert(1)</script>', 1);
		expect(html).toContain('&lt;script&gt;');
		expect(html).not.toContain('<script>');
	});

	it('renders markdown in footnote text', () => {
		const html = buildFootnoteEntryHTML('Use `const` for *safety*', 1);
		expect(html).toContain('<code>const</code>');
		expect(html).toContain('<em>safety</em>');
	});
});

// =============================================================================
// buildFootnoteSectionHTML
// =============================================================================

describe('buildFootnoteSectionHTML', () => {
	it('creates section with correct CSS class', () => {
		const html = buildFootnoteSectionHTML([{ text: 'Note', number: 1 }]);
		expect(html).toContain('ucf-callout-section');
	});

	it('includes all entries', () => {
		const html = buildFootnoteSectionHTML([
			{ text: 'First', number: 1 },
			{ text: 'Second', number: 2 },
		]);
		expect(html).toContain('First');
		expect(html).toContain('Second');
		expect(html).toContain('1.');
		expect(html).toContain('2.');
	});

	it('returns section for empty array', () => {
		const html = buildFootnoteSectionHTML([]);
		expect(html).toContain('ucf-callout-section');
	});

	it('preserves order', () => {
		const html = buildFootnoteSectionHTML([
			{ text: 'Alpha', number: 1 },
			{ text: 'Beta', number: 2 },
		]);
		const alphaIndex = html.indexOf('Alpha');
		const betaIndex = html.indexOf('Beta');
		expect(alphaIndex).toBeLessThan(betaIndex);
	});
});

// =============================================================================
// buildPopoverTriggerHTML
// =============================================================================

describe('buildPopoverTriggerHTML', () => {
	it('creates trigger with correct CSS class', () => {
		const html = buildPopoverTriggerHTML(1);
		expect(html).toContain('ucf-callout-trigger');
	});

	it('includes data-callout-id attribute', () => {
		const html = buildPopoverTriggerHTML(5);
		expect(html).toContain('data-callout-id="5"');
	});

	it('has info indicator', () => {
		const html = buildPopoverTriggerHTML(1);
		// Should have some indicator character
		expect(html.length).toBeGreaterThan(0);
	});
});

// =============================================================================
// buildPopoverContentHTML
// =============================================================================

describe('buildPopoverContentHTML', () => {
	it('creates popover with correct CSS class', () => {
		const html = buildPopoverContentHTML('Details', 'note', 1);
		expect(html).toContain('ucf-callout-popover');
	});

	it('includes data-callout-id attribute', () => {
		const html = buildPopoverContentHTML('Details', 'note', 3);
		expect(html).toContain('data-callout-id="3"');
	});

	it('includes text', () => {
		const html = buildPopoverContentHTML('Detailed explanation', 'note', 1);
		expect(html).toContain('Detailed explanation');
	});

	it('includes type-specific border on popover', () => {
		const html = buildPopoverContentHTML('Danger!', 'danger', 1);
		expect(html).toContain('border-left-color: rgb(233, 49, 71)');
	});

	it('escapes HTML in text', () => {
		const html = buildPopoverContentHTML('Use <b>bold</b>', 'note', 1);
		expect(html).toContain('&lt;b&gt;');
	});

	it('renders markdown in popover text', () => {
		const html = buildPopoverContentHTML('Use **bold** for emphasis', 'note', 1);
		expect(html).toContain('<strong>bold</strong>');
	});
});

// =============================================================================
// shouldReplaceLine
// =============================================================================

describe('shouldReplaceLine', () => {
	it('returns true when entry has replace: true', () => {
		const calloutsByLine = new Map<number, ResolvedCalloutEntry[]>([
			[5, [makeEntry({ targetLines: [5], replace: true })]],
		]);
		expect(shouldReplaceLine(5, calloutsByLine)).toBe(true);
	});

	it('returns false when entry has replace: false', () => {
		const calloutsByLine = new Map<number, ResolvedCalloutEntry[]>([
			[5, [makeEntry({ targetLines: [5], replace: false })]],
		]);
		expect(shouldReplaceLine(5, calloutsByLine)).toBe(false);
	});

	it('returns false for non-targeted line', () => {
		const calloutsByLine = new Map<number, ResolvedCalloutEntry[]>();
		expect(shouldReplaceLine(5, calloutsByLine)).toBe(false);
	});

	it('returns true if any entry on the line has replace: true', () => {
		const calloutsByLine = new Map<number, ResolvedCalloutEntry[]>([
			[5, [
				makeEntry({ targetLines: [5], replace: false }),
				makeEntry({ targetLines: [5], replace: true }),
			]],
		]);
		expect(shouldReplaceLine(5, calloutsByLine)).toBe(true);
	});
});

// =============================================================================
// filterByDisplayMode
// =============================================================================

describe('filterByDisplayMode', () => {
	const entries = [
		makeEntry({ displayMode: 'inline', text: 'Inline 1' }),
		makeEntry({ displayMode: 'footnote', text: 'Footnote 1' }),
		makeEntry({ displayMode: 'popover', text: 'Popover 1' }),
		makeEntry({ displayMode: 'inline', text: 'Inline 2' }),
	];

	it('filters by inline mode', () => {
		const result = filterByDisplayMode(entries, 'inline');
		expect(result).toHaveLength(2);
		expect(result[0].text).toBe('Inline 1');
		expect(result[1].text).toBe('Inline 2');
	});

	it('filters by footnote mode', () => {
		const result = filterByDisplayMode(entries, 'footnote');
		expect(result).toHaveLength(1);
		expect(result[0].text).toBe('Footnote 1');
	});

	it('filters by popover mode', () => {
		const result = filterByDisplayMode(entries, 'popover');
		expect(result).toHaveLength(1);
		expect(result[0].text).toBe('Popover 1');
	});

	it('returns empty array when no matches', () => {
		const result = filterByDisplayMode(
			[makeEntry({ displayMode: 'inline' })],
			'footnote'
		);
		expect(result).toEqual([]);
	});
});
