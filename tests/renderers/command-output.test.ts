/**
 * Tests for src/renderers/command-output.ts
 *
 * Covers: createStyledSpanHtml, processOutputLine, processAllOutputLines,
 * getCommandOutputStylesFromSettings, mergeCommandOutputStyles
 */

import { describe, it, expect } from 'vitest';
import {
	createStyledSpanHtml,
	processOutputLine,
	processAllOutputLines,
	getCommandOutputStylesFromSettings,
	mergeCommandOutputStyles,
} from '../../src/renderers/command-output';
import type { CommandOutputStyles } from '../../src/types';
import { testSettings } from '../helpers/test-settings';

function testStyles(overrides?: Partial<CommandOutputStyles>): CommandOutputStyles {
	return {
		promptColour: '#6b7280',
		promptBold: false,
		promptItalic: false,
		commandColour: '#98c379',
		commandBold: true,
		commandItalic: false,
		outputColour: '',
		outputBold: false,
		outputItalic: false,
		...overrides,
	};
}

// =============================================================================
// createStyledSpanHtml
// =============================================================================

describe('createStyledSpanHtml', () => {
	it('creates a span with class and content', () => {
		const html = createStyledSpanHtml('ucf-prompt', 'hello', '');
		expect(html).toBe('<span class="ucf-prompt">hello</span>');
	});

	it('includes style attribute when provided', () => {
		const html = createStyledSpanHtml('ucf-cmd', 'text', 'color: red');
		expect(html).toBe('<span class="ucf-cmd" style="color: red">text</span>');
	});

	it('omits style attribute when empty', () => {
		const html = createStyledSpanHtml('cls', 'content', '');
		expect(html).not.toContain('style');
	});
});

// =============================================================================
// processOutputLine
// =============================================================================

describe('processOutputLine', () => {
	const noStyles = { prompt: '', command: '', output: '' };

	it('renders an output line when no prompt pattern', () => {
		const html = processOutputLine('hello', undefined, noStyles);
		expect(html).toContain('ucf-cmdout-output');
		expect(html).toContain('hello');
	});

	it('escapes HTML in output lines', () => {
		const html = processOutputLine('<script>', undefined, noStyles);
		expect(html).toContain('&lt;script&gt;');
		expect(html).not.toContain('<script>');
	});

	it('renders &nbsp; for empty lines', () => {
		const html = processOutputLine('', undefined, noStyles);
		expect(html).toContain('&nbsp;');
	});

	it('splits command line into prompt and command spans', () => {
		const pattern = /^(\$\s)(.*)/;
		const html = processOutputLine('$ ls -la', pattern, noStyles);
		expect(html).toContain('ucf-cmdout-prompt');
		expect(html).toContain('ucf-cmdout-command');
		expect(html).toContain('ucf-cmdout-cmdline');
	});

	it('extracts correct prompt and command text', () => {
		const pattern = /^(\$\s)(.*)/;
		const html = processOutputLine('$ echo hello', pattern, noStyles);
		expect(html).toContain('>$ <');
		expect(html).toContain('>echo hello<');
	});

	it('treats non-matching lines as output even with a pattern', () => {
		const pattern = /^(\$\s)(.*)/;
		const html = processOutputLine('some output', pattern, noStyles);
		expect(html).toContain('ucf-cmdout-output');
		expect(html).not.toContain('ucf-cmdout-cmdline');
	});

	it('applies style to output lines', () => {
		const styles = { prompt: '', command: '', output: 'color: gray' };
		const html = processOutputLine('output text', undefined, styles);
		expect(html).toContain('style="color: gray"');
	});

	it('applies style to prompt and command spans', () => {
		const pattern = /^(\$\s)(.*)/;
		const styles = { prompt: 'color: green', command: 'font-weight: bold', output: '' };
		const html = processOutputLine('$ cmd', pattern, styles);
		expect(html).toContain('style="color: green"');
		expect(html).toContain('style="font-weight: bold"');
	});
});

// =============================================================================
// processAllOutputLines
// =============================================================================

describe('processAllOutputLines', () => {
	const noStyles = { prompt: '', command: '', output: '' };

	it('processes multiple lines', () => {
		const html = processAllOutputLines('line1\nline2\nline3', undefined, noStyles);
		expect(html).toContain('line1');
		expect(html).toContain('line2');
		expect(html).toContain('line3');
	});

	it('strips trailing empty line', () => {
		const html = processAllOutputLines('line1\n', undefined, noStyles);
		// Should produce 1 span, not 2
		const spans = html.match(/ucf-cmdout-line/g);
		expect(spans?.length).toBe(1);
	});

	it('handles empty input', () => {
		const html = processAllOutputLines('', undefined, noStyles);
		expect(html).toBe('');
	});

	it('mixes command and output lines', () => {
		const pattern = /^(\$\s)(.*)/;
		const html = processAllOutputLines('$ ls\nfile.txt\n$ pwd\n/home', pattern, noStyles);
		expect(html).toContain('ucf-cmdout-cmdline');
		expect(html).toContain('ucf-cmdout-output');
	});

	it('renders &nbsp; for blank lines in the middle', () => {
		const html = processAllOutputLines('a\n\nb', undefined, noStyles);
		expect(html).toContain('&nbsp;');
	});
});

// =============================================================================
// getCommandOutputStylesFromSettings
// =============================================================================

describe('getCommandOutputStylesFromSettings', () => {
	it('extracts prompt styles from settings', () => {
		const styles = getCommandOutputStylesFromSettings(testSettings({
			commandPromptColour: '#ff0000',
			commandPromptBold: true,
			commandPromptItalic: true,
		}));
		expect(styles.promptColour).toBe('#ff0000');
		expect(styles.promptBold).toBe(true);
		expect(styles.promptItalic).toBe(true);
	});

	it('extracts command styles from settings', () => {
		const styles = getCommandOutputStylesFromSettings(testSettings({
			commandTextColour: '#00ff00',
			commandTextBold: false,
			commandTextItalic: true,
		}));
		expect(styles.commandColour).toBe('#00ff00');
		expect(styles.commandBold).toBe(false);
		expect(styles.commandItalic).toBe(true);
	});

	it('extracts output styles from settings', () => {
		const styles = getCommandOutputStylesFromSettings(testSettings({
			outputTextColour: '#0000ff',
			outputTextBold: true,
			outputTextItalic: true,
		}));
		expect(styles.outputColour).toBe('#0000ff');
		expect(styles.outputBold).toBe(true);
		expect(styles.outputItalic).toBe(true);
	});

	it('maps default settings correctly', () => {
		const styles = getCommandOutputStylesFromSettings(testSettings());
		expect(styles.promptColour).toBe('#6b7280');
		expect(styles.promptBold).toBe(false);
		expect(styles.commandColour).toBe('#98c379');
		expect(styles.commandBold).toBe(true);
		expect(styles.outputColour).toBe('');
		expect(styles.outputBold).toBe(false);
	});
});

// =============================================================================
// mergeCommandOutputStyles
// =============================================================================

describe('mergeCommandOutputStyles', () => {
	it('returns defaults when no overrides provided', () => {
		const defaults = testStyles();
		const merged = mergeCommandOutputStyles(defaults, {});
		expect(merged).toEqual(defaults);
	});

	it('overrides prompt colour', () => {
		const merged = mergeCommandOutputStyles(testStyles(), { promptColour: '#ff0000' });
		expect(merged.promptColour).toBe('#ff0000');
	});

	it('overrides prompt bold', () => {
		const merged = mergeCommandOutputStyles(testStyles(), { promptBold: true });
		expect(merged.promptBold).toBe(true);
	});

	it('overrides command colour', () => {
		const merged = mergeCommandOutputStyles(testStyles(), { commandColour: '#abc' });
		expect(merged.commandColour).toBe('#abc');
	});

	it('overrides command italic', () => {
		const merged = mergeCommandOutputStyles(testStyles(), { commandItalic: true });
		expect(merged.commandItalic).toBe(true);
	});

	it('overrides output colour', () => {
		const merged = mergeCommandOutputStyles(testStyles(), { outputColour: '#999' });
		expect(merged.outputColour).toBe('#999');
	});

	it('overrides output bold and italic together', () => {
		const merged = mergeCommandOutputStyles(testStyles(), {
			outputBold: true,
			outputItalic: true,
		});
		expect(merged.outputBold).toBe(true);
		expect(merged.outputItalic).toBe(true);
	});

	it('preserves non-overridden fields', () => {
		const defaults = testStyles();
		const merged = mergeCommandOutputStyles(defaults, { promptColour: '#ff0000' });
		expect(merged.commandColour).toBe(defaults.commandColour);
		expect(merged.commandBold).toBe(defaults.commandBold);
		expect(merged.outputColour).toBe(defaults.outputColour);
	});

	it('overrides all fields when fully specified', () => {
		const allOverrides: CommandOutputStyles = {
			promptColour: '#111',
			promptBold: true,
			promptItalic: true,
			commandColour: '#222',
			commandBold: false,
			commandItalic: true,
			outputColour: '#333',
			outputBold: true,
			outputItalic: true,
		};
		const merged = mergeCommandOutputStyles(testStyles(), allOverrides);
		expect(merged).toEqual(allOverrides);
	});

	it('handles false overrides (does not fall back to default)', () => {
		const defaults = testStyles({ commandBold: true });
		const merged = mergeCommandOutputStyles(defaults, { commandBold: false });
		expect(merged.commandBold).toBe(false);
	});

	it('handles empty string override for colour', () => {
		const defaults = testStyles({ promptColour: '#6b7280' });
		const merged = mergeCommandOutputStyles(defaults, { promptColour: '' });
		expect(merged.promptColour).toBe('');
	});
});
