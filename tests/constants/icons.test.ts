/**
 * Tests for src/constants/icons.ts
 *
 * Covers: getIconColour, getIconLabel, getIconEmoji
 */

import { describe, it, expect } from 'vitest';
import {
	getIconColour,
	getIconLabel,
	getIconEmoji,
	DEFAULT_ICON_COLOUR,
	DEFAULT_ICON_LABEL,
	DEFAULT_ICON_EMOJI,
	ICON_COLOURS,
	ICON_LABELS,
	ICON_EMOJIS,
} from '../../src/constants/icons';

// =============================================================================
// getIconColour
// =============================================================================

describe('getIconColour', () => {
	it('returns colour for known language', () => {
		expect(getIconColour('javascript')).toBe('#eab308');
	});

	it('returns colour for known extension', () => {
		expect(getIconColour('ts')).toBe('#3178c6');
	});

	it('is case-insensitive', () => {
		expect(getIconColour('Python')).toBe('#22c55e');
		expect(getIconColour('RUST')).toBe('#b7410e');
	});

	it('returns default colour for unknown language', () => {
		expect(getIconColour('brainfuck')).toBe(DEFAULT_ICON_COLOUR);
	});

	it('returns default colour for undefined', () => {
		expect(getIconColour(undefined)).toBe(DEFAULT_ICON_COLOUR);
	});

	it('returns default colour for empty string', () => {
		expect(getIconColour('')).toBe(DEFAULT_ICON_COLOUR);
	});

	it('maps shell variants to the same colour', () => {
		const shellColour = ICON_COLOURS['bash'];
		expect(getIconColour('bash')).toBe(shellColour);
		expect(getIconColour('sh')).toBe(shellColour);
		expect(getIconColour('shell')).toBe(shellColour);
		expect(getIconColour('zsh')).toBe(shellColour);
	});
});

// =============================================================================
// getIconLabel
// =============================================================================

describe('getIconLabel', () => {
	it('returns label for known language', () => {
		expect(getIconLabel('javascript')).toBe('JS');
	});

	it('returns label for known extension', () => {
		expect(getIconLabel('py')).toBe('PY');
	});

	it('is case-insensitive', () => {
		expect(getIconLabel('TypeScript')).toBe('TS');
		expect(getIconLabel('HTML')).toBe('HTML');
	});

	it('returns default label for unknown language', () => {
		expect(getIconLabel('haskell')).toBe(DEFAULT_ICON_LABEL);
	});

	it('returns default label for undefined', () => {
		expect(getIconLabel(undefined)).toBe(DEFAULT_ICON_LABEL);
	});

	it('uses fallback when provided and key is unknown', () => {
		expect(getIconLabel('haskell', 'haskell')).toBe('HASKELL');
	});

	it('uppercases the fallback', () => {
		expect(getIconLabel('elixir', 'elixir')).toBe('ELIXIR');
	});

	it('uses fallback for undefined key', () => {
		expect(getIconLabel(undefined, 'custom')).toBe('CUSTOM');
	});

	it('prefers mapped label over fallback for known languages', () => {
		expect(getIconLabel('rust', 'fallback')).toBe('RS');
	});

	it('maps C++ correctly', () => {
		expect(getIconLabel('cpp')).toBe('C++');
	});

	it('maps C# correctly', () => {
		expect(getIconLabel('csharp')).toBe('C#');
		expect(getIconLabel('cs')).toBe('C#');
	});
});

// =============================================================================
// getIconEmoji
// =============================================================================

describe('getIconEmoji', () => {
	it('returns emoji for known language', () => {
		expect(getIconEmoji('python')).toBe('🐍');
	});

	it('returns emoji for known extension', () => {
		expect(getIconEmoji('rs')).toBe('🦀');
	});

	it('is case-insensitive', () => {
		expect(getIconEmoji('Go')).toBe('🐹');
		expect(getIconEmoji('DOCKER')).toBe('🐳');
	});

	it('returns default emoji for unknown language', () => {
		expect(getIconEmoji('cobol')).toBe(DEFAULT_ICON_EMOJI);
	});

	it('returns default emoji for undefined', () => {
		expect(getIconEmoji(undefined)).toBe(DEFAULT_ICON_EMOJI);
	});

	it('returns default emoji for empty string', () => {
		expect(getIconEmoji('')).toBe(DEFAULT_ICON_EMOJI);
	});

	it('maps Java/Kotlin to coffee', () => {
		expect(getIconEmoji('java')).toBe('☕');
		expect(getIconEmoji('kotlin')).toBe('☕');
	});

	it('maps Ruby to gem', () => {
		expect(getIconEmoji('ruby')).toBe('💎');
		expect(getIconEmoji('rb')).toBe('💎');
	});
});

// =============================================================================
// Data integrity
// =============================================================================

describe('icon data integrity', () => {
	it('every colour key has a matching label key', () => {
		for (const key of Object.keys(ICON_COLOURS)) {
			expect(ICON_LABELS).toHaveProperty(key);
		}
	});

	it('every colour key has a matching emoji key', () => {
		for (const key of Object.keys(ICON_COLOURS)) {
			expect(ICON_EMOJIS).toHaveProperty(key);
		}
	});

	it('every label key has a matching colour key', () => {
		for (const key of Object.keys(ICON_LABELS)) {
			expect(ICON_COLOURS).toHaveProperty(key);
		}
	});

	it('all three maps have identical key sets', () => {
		const colourKeys = Object.keys(ICON_COLOURS).sort();
		const labelKeys = Object.keys(ICON_LABELS).sort();
		const emojiKeys = Object.keys(ICON_EMOJIS).sort();
		expect(colourKeys).toEqual(labelKeys);
		expect(colourKeys).toEqual(emojiKeys);
	});
});
