/**
 * Tests for src/renderers/command-output.ts
 *
 * Covers the pure exported functions: getCommandOutputStylesFromSettings,
 * mergeCommandOutputStyles
 */

import { describe, it, expect } from 'vitest';
import {
	getCommandOutputStylesFromSettings,
	mergeCommandOutputStyles,
} from '../../src/renderers/command-output';
import type { CommandOutputStyles, PluginSettings } from '../../src/types';
import { DEFAULT_SETTINGS } from '../../src/constants/defaults';

// =============================================================================
// Helpers
// =============================================================================

function testSettings(overrides?: Partial<PluginSettings>): PluginSettings {
	return { ...DEFAULT_SETTINGS, ...overrides };
}

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
