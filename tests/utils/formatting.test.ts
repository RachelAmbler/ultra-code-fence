/**
 * Tests for src/utils/formatting.ts
 *
 * Covers: escapeHtml, buildStyleString, applyCaseFormat,
 *         formatFileSize, calculateRelativeTime, formatTimestamp
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	escapeHtml,
	buildStyleString,
	applyCaseFormat,
	formatFileSize,
	calculateRelativeTime,
	formatTimestamp,
} from '../../src/utils/formatting';

// =============================================================================
// escapeHtml
// =============================================================================

describe('escapeHtml', () => {
	it('escapes ampersands', () => {
		expect(escapeHtml('a & b')).toBe('a &amp; b');
	});

	it('escapes angle brackets', () => {
		expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
	});

	it('escapes double quotes', () => {
		expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
	});

	it('escapes single quotes', () => {
		expect(escapeHtml("it's")).toBe('it&#039;s');
	});

	it('escapes all special characters together', () => {
		expect(escapeHtml('<a href="x" class=\'y\'>&')).toBe(
			'&lt;a href=&quot;x&quot; class=&#039;y&#039;&gt;&amp;'
		);
	});

	it('returns unchanged text when nothing to escape', () => {
		expect(escapeHtml('plain text 123')).toBe('plain text 123');
	});

	it('handles empty string', () => {
		expect(escapeHtml('')).toBe('');
	});
});

// =============================================================================
// buildStyleString
// =============================================================================

describe('buildStyleString', () => {
	it('builds colour only', () => {
		expect(buildStyleString('#ff0000', false, false)).toBe('color: #ff0000');
	});

	it('builds bold only', () => {
		expect(buildStyleString('', true, false)).toBe('font-weight: bold');
	});

	it('builds italic only', () => {
		expect(buildStyleString('', false, true)).toBe('font-style: italic');
	});

	it('combines all three', () => {
		expect(buildStyleString('#abc', true, true)).toBe(
			'color: #abc; font-weight: bold; font-style: italic'
		);
	});

	it('returns empty string when nothing set', () => {
		expect(buildStyleString('', false, false)).toBe('');
	});

	it('combines colour and bold without italic', () => {
		expect(buildStyleString('red', true, false)).toBe(
			'color: red; font-weight: bold'
		);
	});
});

// =============================================================================
// applyCaseFormat
// =============================================================================

describe('applyCaseFormat', () => {
	it('converts to upper case', () => {
		expect(applyCaseFormat('hello world', 'upper')).toBe('HELLO WORLD');
	});

	it('converts to lower case', () => {
		expect(applyCaseFormat('Hello World', 'lower')).toBe('hello world');
	});

	it('converts to title case', () => {
		expect(applyCaseFormat('hello world', 'title')).toBe('Hello World');
	});

	it('capitalises first letter only', () => {
		expect(applyCaseFormat('hELLO', 'capitalise')).toBe('Hello');
	});

	it('returns unchanged for unknown format', () => {
		// Cast to bypass type checking for edge-case coverage
		expect(applyCaseFormat('Hello', 'unknown' as never)).toBe('Hello');
	});

	it('handles empty string', () => {
		expect(applyCaseFormat('', 'upper')).toBe('');
	});

	it('title-cases hyphenated words', () => {
		expect(applyCaseFormat('my-file', 'title')).toBe('My-File');
	});
});

// =============================================================================
// formatFileSize
// =============================================================================

describe('formatFileSize', () => {
	it('returns "0 B" for zero bytes', () => {
		expect(formatFileSize(0)).toBe('0 B');
	});

	it('formats bytes explicitly', () => {
		expect(formatFileSize(1024, 'bytes')).toBe('1024 B');
	});

	it('formats kilobytes', () => {
		expect(formatFileSize(1536, 'kb')).toBe('1.5 KB');
	});

	it('formats megabytes', () => {
		expect(formatFileSize(1048576, 'mb')).toBe('1.00 MB');
	});

	it('formats gigabytes', () => {
		expect(formatFileSize(1073741824, 'gb')).toBe('1.00 GB');
	});

	it('auto-selects bytes for small values', () => {
		expect(formatFileSize(500)).toBe('500 B');
	});

	it('auto-selects KB for 1024', () => {
		expect(formatFileSize(1024)).toBe('1.0 KB');
	});

	it('auto-selects MB for 1 million+ bytes', () => {
		const result = formatFileSize(2 * 1024 * 1024);
		expect(result).toBe('2.0 MB');
	});

	it('defaults to auto when no format specified', () => {
		expect(formatFileSize(512)).toBe('512 B');
	});
});

// =============================================================================
// calculateRelativeTime
// =============================================================================

describe('calculateRelativeTime', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns "just now" for very recent timestamps', () => {
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(calculateRelativeTime(now - 5000)).toBe('just now');
	});

	it('returns minutes for 1-59 minutes ago', () => {
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(calculateRelativeTime(now - 5 * 60 * 1000)).toBe('5 minutes ago');
	});

	it('returns singular minute', () => {
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(calculateRelativeTime(now - 60 * 1000)).toBe('1 minute ago');
	});

	it('returns hours for 1-23 hours ago', () => {
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(calculateRelativeTime(now - 3 * 3600 * 1000)).toBe('3 hours ago');
	});

	it('returns singular hour', () => {
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(calculateRelativeTime(now - 3600 * 1000)).toBe('1 hour ago');
	});

	it('returns days for 1-6 days ago', () => {
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(calculateRelativeTime(now - 3 * 86400 * 1000)).toBe('3 days ago');
	});

	it('returns singular day', () => {
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(calculateRelativeTime(now - 86400 * 1000)).toBe('1 day ago');
	});

	it('returns weeks for 1-3 weeks ago', () => {
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(calculateRelativeTime(now - 14 * 86400 * 1000)).toBe('2 weeks ago');
	});

	it('returns singular week', () => {
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(calculateRelativeTime(now - 7 * 86400 * 1000)).toBe('1 week ago');
	});

	it('returns months for 1-11 months ago', () => {
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(calculateRelativeTime(now - 60 * 86400 * 1000)).toBe('2 months ago');
	});

	it('returns singular month', () => {
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(calculateRelativeTime(now - 30 * 86400 * 1000)).toBe('1 month ago');
	});

	it('returns years for 365+ days ago', () => {
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(calculateRelativeTime(now - 400 * 86400 * 1000)).toBe('1 year ago');
	});

	it('returns plural years', () => {
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(calculateRelativeTime(now - 800 * 86400 * 1000)).toBe('2 years ago');
	});
});

// =============================================================================
// formatTimestamp
// =============================================================================

describe('formatTimestamp', () => {
	it('returns "N/A" for zero/falsy timestamp', () => {
		expect(formatTimestamp(0)).toBe('N/A');
	});

	it('formats as ISO', () => {
		// 2025-06-15T12:30:00.000Z
		const ts = Date.UTC(2025, 5, 15, 12, 30, 0);
		expect(formatTimestamp(ts, 'iso')).toBe('2025-06-15T12:30:00');
	});

	it('formats as relative', () => {
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);
		expect(formatTimestamp(now - 3600000, 'relative')).toBe('1 hour ago');
	});

	it('formats as short (returns a non-empty string)', () => {
		const ts = Date.UTC(2025, 5, 15, 12, 0, 0);
		const result = formatTimestamp(ts, 'short');
		expect(result.length).toBeGreaterThan(0);
	});

	it('formats as long (returns a non-empty string)', () => {
		const ts = Date.UTC(2025, 5, 15, 12, 0, 0);
		const result = formatTimestamp(ts, 'long');
		// 'long' format includes month name
		expect(result).toContain('2025');
	});

	it('formats as date (returns year and month)', () => {
		const ts = Date.UTC(2025, 5, 15);
		const result = formatTimestamp(ts, 'date');
		expect(result).toContain('2025');
	});

	it('formats as time (returns a non-empty string)', () => {
		const ts = Date.UTC(2025, 5, 15, 14, 30, 0);
		const result = formatTimestamp(ts, 'time');
		expect(result.length).toBeGreaterThan(0);
	});

	it('defaults to long format', () => {
		const ts = Date.UTC(2025, 5, 15, 12, 0, 0);
		const defaultResult = formatTimestamp(ts);
		const longResult = formatTimestamp(ts, 'long');
		expect(defaultResult).toBe(longResult);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});
});
