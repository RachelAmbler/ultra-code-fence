/**
 * Tests for src/renderers/buttons.ts
 *
 * Covers: joinCodeLines (pure function)
 */

import { describe, it, expect } from 'vitest';
import { joinCodeLines } from '../../src/renderers/buttons';

describe('joinCodeLines', () => {
	it('joins lines with the given operator', () => {
		expect(joinCodeLines('a\nb\nc', '&&')).toBe('a && b && c');
	});

	it('trims whitespace from each line', () => {
		expect(joinCodeLines('  a  \n  b  ', ';')).toBe('a ; b');
	});

	it('filters out empty lines', () => {
		expect(joinCodeLines('a\n\n\nb', '&&')).toBe('a && b');
	});

	it('filters lines matching ignoreRegex', () => {
		const ignoreComments = /^#/;
		expect(joinCodeLines('a\n# comment\nb', '&&', ignoreComments)).toBe('a && b');
	});

	it('handles single line input', () => {
		expect(joinCodeLines('single', '&&')).toBe('single');
	});

	it('handles empty input', () => {
		expect(joinCodeLines('', '&&')).toBe('');
	});

	it('handles only-whitespace lines', () => {
		expect(joinCodeLines('  \n  \n  ', '&&')).toBe('');
	});

	it('works with semicolon operator', () => {
		expect(joinCodeLines('cd /tmp\nls -la', ';')).toBe('cd /tmp ; ls -la');
	});

	it('ignoreRegex filters after trimming', () => {
		// "  # comment  " should be trimmed to "# comment" and then matched
		const ignoreComments = /^#/;
		expect(joinCodeLines('a\n  # comment  \nb', '&&', ignoreComments)).toBe('a && b');
	});

	it('ignoreRegex can filter continuation backslashes', () => {
		const ignoreBackslash = /\\$/;
		expect(joinCodeLines('cmd \\\narg1\narg2', '&&', ignoreBackslash)).toBe('arg1 && arg2');
	});

	it('works with pipe operator', () => {
		expect(joinCodeLines('cat file\ngrep pattern\nsort', '|')).toBe('cat file | grep pattern | sort');
	});

	it('preserves internal spaces in lines', () => {
		expect(joinCodeLines('hello world\nfoo bar', '&&')).toBe('hello world && foo bar');
	});
});
