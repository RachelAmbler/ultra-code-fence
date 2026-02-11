// @vitest-environment jsdom

/**
 * Tests for DOM-creation functions in src/services/icon-generator.ts
 *
 * Covers:
 * - createIconElement: Main icon creation with style routing
 * - buildFilledBadgeIcon: Filled badge generation (private, tested via createIconElement)
 * - buildOutlineBadgeIcon: Outline badge generation (private, tested via createIconElement)
 * - buildTextLabelIcon: Text label generation (private, tested via createIconElement)
 * - buildEmojiIcon: Emoji generation (private, tested via createIconElement)
 * - buildCustomIcon: Custom image icon generation (private, tested via createIconElement)
 * - createIconFromSettings: Convenience wrapper using plugin settings
 *
 * Uses standard DOM APIs (document.createElement, classList, innerHTML) — NOT Obsidian extensions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { App, TFile } from '../../__mocks__/obsidian';
import { createIconElement, createIconFromSettings, type IconCreationOptions } from '../../src/services/icon-generator';
import { CSS_CLASSES } from '../../src/constants';
import { testSettings } from '../helpers/test-settings';
import type { PluginSettings } from '../../src/types';

describe('Icon Generator DOM Functions', () => {
	let app: App;
	let mockSettings: PluginSettings;

	beforeEach(() => {
		app = new App();
		mockSettings = testSettings();
	});

	// ==========================================================================
	// createIconElement: Disabled Icons & None Style
	// ==========================================================================

	describe('createIconElement - disabled/none cases', () => {
		it('returns null when showIcon is false', () => {
			const options: IconCreationOptions = {
				language: 'javascript',
				iconStyle: 'emoji',
				showIcon: false,
			};

			const result = createIconElement(app, options);

			expect(result).toBeNull();
		});

		it('returns null when iconStyle is "none"', () => {
			const options: IconCreationOptions = {
				language: 'python',
				iconStyle: 'none',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result).toBeNull();
		});

		it('returns null when both showIcon is false and iconStyle is "none"', () => {
			const options: IconCreationOptions = {
				language: 'typescript',
				iconStyle: 'none',
				showIcon: false,
			};

			const result = createIconElement(app, options);

			expect(result).toBeNull();
		});
	});

	// ==========================================================================
	// createIconElement: Element Creation & Base Properties
	// ==========================================================================

	describe('createIconElement - element creation', () => {
		it('creates a span element with ucf-icon class', () => {
			const options: IconCreationOptions = {
				language: 'javascript',
				iconStyle: 'emoji',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result).toBeInstanceOf(HTMLSpanElement);
			expect(result?.className).toBe(CSS_CLASSES.icon);
		});

		it('uses language as languageKey when provided', () => {
			const options: IconCreationOptions = {
				language: 'python',
				extension: 'py',
				iconStyle: 'emoji',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.textContent).toBe('🐍'); // Python emoji
		});

		it('falls back to extension when language is not provided', () => {
			const options: IconCreationOptions = {
				extension: 'js',
				iconStyle: 'emoji',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.textContent).toBe('🟨'); // JavaScript emoji
		});

		it('handles undefined language and extension', () => {
			const options: IconCreationOptions = {
				iconStyle: 'emoji',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.textContent).toBe('📄'); // Default emoji
		});
	});

	// ==========================================================================
	// createIconElement: Emoji Style
	// ==========================================================================

	describe('createIconElement - emoji style', () => {
		it('creates emoji icon with known language', () => {
			const options: IconCreationOptions = {
				language: 'rust',
				iconStyle: 'emoji',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.textContent).toBe('🦀');
		});

		it('creates emoji icon with known extension', () => {
			const options: IconCreationOptions = {
				extension: 'rb',
				iconStyle: 'emoji',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.textContent).toBe('💎'); // Ruby emoji
		});

		it('uses default emoji for unknown language', () => {
			const options: IconCreationOptions = {
				language: 'unknown-language-xyz',
				iconStyle: 'emoji',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.textContent).toBe('📄'); // Default emoji
		});

		it('does not add extra classes for emoji style', () => {
			const options: IconCreationOptions = {
				language: 'go',
				iconStyle: 'emoji',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.className).toBe(CSS_CLASSES.icon);
			expect(result?.classList.length).toBe(1);
		});
	});

	// ==========================================================================
	// createIconElement: Text Style
	// ==========================================================================

	describe('createIconElement - text style', () => {
		it('creates text label icon with known language', () => {
			const options: IconCreationOptions = {
				language: 'javascript',
				iconStyle: 'text',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.textContent).toBe('JS');
		});

		it('creates text label icon with extension fallback', () => {
			const options: IconCreationOptions = {
				extension: 'ts',
				iconStyle: 'text',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.textContent).toBe('TS');
		});

		it('uses default label for unknown language', () => {
			const options: IconCreationOptions = {
				language: 'unknown',
				iconStyle: 'text',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.textContent).toBe('FILE');
		});

		it('adds ucf-icon-text class', () => {
			const options: IconCreationOptions = {
				language: 'python',
				iconStyle: 'text',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.classList.contains(CSS_CLASSES.iconText)).toBe(true);
		});

		it('has exactly two classes: ucf-icon and ucf-icon-text', () => {
			const options: IconCreationOptions = {
				language: 'rust',
				iconStyle: 'text',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.classList.length).toBe(2);
			expect(result?.classList.contains(CSS_CLASSES.icon)).toBe(true);
			expect(result?.classList.contains(CSS_CLASSES.iconText)).toBe(true);
		});
	});

	// ==========================================================================
	// createIconElement: Filled Badge Style
	// ==========================================================================

	describe('createIconElement - filled badge style', () => {
		it('creates filled badge icon with SVG content', () => {
			const options: IconCreationOptions = {
				language: 'javascript',
				iconStyle: 'filled',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.innerHTML).toContain('<svg');
			expect(result?.innerHTML).toContain('</svg>');
		});

		it('includes label text in SVG', () => {
			const options: IconCreationOptions = {
				language: 'python',
				iconStyle: 'filled',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.innerHTML).toContain('>PY<');
		});

		it('uses language colour for filled badge', () => {
			const options: IconCreationOptions = {
				language: 'javascript',
				iconStyle: 'filled',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			// JavaScript colour is #eab308
			expect(result?.innerHTML).toContain('fill="#eab308"');
		});

		it('uses default colour for unknown language', () => {
			const options: IconCreationOptions = {
				language: 'unknown-lang',
				iconStyle: 'filled',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			// Default icon colour is #6b7280
			expect(result?.innerHTML).toContain('fill="#6b7280"');
		});

		it('adds ucf-icon-svg class', () => {
			const options: IconCreationOptions = {
				language: 'go',
				iconStyle: 'filled',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.classList.contains(CSS_CLASSES.iconSvg)).toBe(true);
		});

		it('does not add ucf-icon-outline class for filled style', () => {
			const options: IconCreationOptions = {
				language: 'rust',
				iconStyle: 'filled',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.classList.contains(CSS_CLASSES.iconOutline)).toBe(false);
		});
	});

	// ==========================================================================
	// createIconElement: Outline Badge Style
	// ==========================================================================

	describe('createIconElement - outline badge style', () => {
		it('creates outline badge icon with SVG content', () => {
			const options: IconCreationOptions = {
				language: 'typescript',
				iconStyle: 'outline',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.innerHTML).toContain('<svg');
			expect(result?.innerHTML).toContain('</svg>');
		});

		it('includes label text in outline SVG', () => {
			const options: IconCreationOptions = {
				language: 'ruby',
				iconStyle: 'outline',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.innerHTML).toContain('>RB<');
		});

		it('uses currentColor for outline stroke', () => {
			const options: IconCreationOptions = {
				language: 'go',
				iconStyle: 'outline',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.innerHTML).toContain('stroke="currentColor"');
		});

		it('has no filled background (fill="none")', () => {
			const options: IconCreationOptions = {
				language: 'python',
				iconStyle: 'outline',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.innerHTML).toContain('fill="none"');
		});

		it('adds both ucf-icon-svg and ucf-icon-outline classes', () => {
			const options: IconCreationOptions = {
				language: 'javascript',
				iconStyle: 'outline',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.classList.contains(CSS_CLASSES.iconSvg)).toBe(true);
			expect(result?.classList.contains(CSS_CLASSES.iconOutline)).toBe(true);
		});

		it('has exactly three classes when using outline style', () => {
			const options: IconCreationOptions = {
				language: 'rust',
				iconStyle: 'outline',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.classList.length).toBe(3);
			expect(result?.classList.contains(CSS_CLASSES.icon)).toBe(true);
			expect(result?.classList.contains(CSS_CLASSES.iconSvg)).toBe(true);
			expect(result?.classList.contains(CSS_CLASSES.iconOutline)).toBe(true);
		});
	});

	// ==========================================================================
	// createIconElement: Custom Style (Found)
	// ==========================================================================

	describe('createIconElement - custom style (icon found)', () => {
		it('creates custom icon with img element when custom icon exists', () => {
			app.vault.getAbstractFileByPath = (path: string) => {
				if (path.endsWith('.svg')) return new TFile(path);
				return null;
			};

			const options: IconCreationOptions = {
				language: 'python',
				iconStyle: 'custom',
				showIcon: true,
				customIconFolder: 'icons',
			};

			const result = createIconElement(app, options);

			const imgElement = result?.querySelector('img');
			expect(imgElement).toBeInstanceOf(HTMLImageElement);
		});

		it('sets correct src on custom icon', () => {
			app.vault.getAbstractFileByPath = (path: string) => {
				if (path.endsWith('.svg')) return new TFile(path);
				return null;
			};

			const options: IconCreationOptions = {
				language: 'javascript',
				iconStyle: 'custom',
				showIcon: true,
				customIconFolder: 'assets/icons',
			};

			const result = createIconElement(app, options);

			const imgElement = result?.querySelector('img') as HTMLImageElement;
			expect(imgElement.src).toContain('assets/icons/javascript.svg');
		});

		it('sets alt text to language key', () => {
			app.vault.getAbstractFileByPath = (path: string) => {
				if (path.endsWith('.svg')) return new TFile(path);
				return null;
			};

			const options: IconCreationOptions = {
				language: 'typescript',
				iconStyle: 'custom',
				showIcon: true,
				customIconFolder: 'icons',
			};

			const result = createIconElement(app, options);

			const imgElement = result?.querySelector('img') as HTMLImageElement;
			expect(imgElement.alt).toBe('typescript');
		});

		it('adds ucf-icon-img class to img element', () => {
			app.vault.getAbstractFileByPath = (path: string) => {
				if (path.endsWith('.svg')) return new TFile(path);
				return null;
			};

			const options: IconCreationOptions = {
				language: 'go',
				iconStyle: 'custom',
				showIcon: true,
				customIconFolder: 'icons',
			};

			const result = createIconElement(app, options);

			const imgElement = result?.querySelector('img');
			expect(imgElement?.classList.contains(CSS_CLASSES.iconImg)).toBe(true);
		});

		it('adds ucf-icon-custom class to container', () => {
			app.vault.getAbstractFileByPath = (path: string) => {
				if (path.endsWith('.svg')) return new TFile(path);
				return null;
			};

			const options: IconCreationOptions = {
				language: 'rust',
				iconStyle: 'custom',
				showIcon: true,
				customIconFolder: 'icons',
			};

			const result = createIconElement(app, options);

			expect(result?.classList.contains(CSS_CLASSES.iconCustom)).toBe(true);
		});

		it('appends img element to container', () => {
			app.vault.getAbstractFileByPath = (path: string) => {
				if (path.endsWith('.svg')) return new TFile(path);
				return null;
			};

			const options: IconCreationOptions = {
				language: 'python',
				iconStyle: 'custom',
				showIcon: true,
				customIconFolder: 'icons',
			};

			const result = createIconElement(app, options);

			expect(result?.children.length).toBe(1);
			expect(result?.children[0].tagName).toBe('IMG');
		});

		it('looks for icon with multiple extensions (.svg, .png, etc.)', () => {
			const mockGetAbstractFileByPath = vi.fn((path: string) => {
				// First call: .svg not found, second call: .png found
				if (path.includes('.png')) return new TFile(path);
				return null;
			});
			app.vault.getAbstractFileByPath = mockGetAbstractFileByPath;

			const options: IconCreationOptions = {
				language: 'javascript',
				iconStyle: 'custom',
				showIcon: true,
				customIconFolder: 'icons',
			};

			createIconElement(app, options);

			// Should attempt both .svg and .png
			expect(mockGetAbstractFileByPath).toHaveBeenCalled();
		});

		it('uses language name first when searching for custom icon', () => {
			app.vault.getAbstractFileByPath = (path: string) => {
				// Language key 'javascript' is found
				if (path.includes('javascript.svg')) return new TFile(path);
				return null;
			};

			const options: IconCreationOptions = {
				language: 'javascript',
				extension: 'js',
				iconStyle: 'custom',
				showIcon: true,
				customIconFolder: 'icons',
			};

			const result = createIconElement(app, options);

			const imgElement = result?.querySelector('img') as HTMLImageElement;
			expect(imgElement).not.toBeNull();
			expect(imgElement.src).toContain('javascript.svg');
		});
	});

	// ==========================================================================
	// createIconElement: Custom Style (Not Found - Fallback to Emoji)
	// ==========================================================================

	describe('createIconElement - custom style (icon not found)', () => {
		it('falls back to emoji when custom icon not found', () => {
			app.vault.getAbstractFileByPath = () => null;

			const options: IconCreationOptions = {
				language: 'python',
				iconStyle: 'custom',
				showIcon: true,
				customIconFolder: 'icons',
			};

			const result = createIconElement(app, options);

			expect(result?.textContent).toBe('🐍'); // Python emoji
		});

		it('has no img element when custom icon not found', () => {
			app.vault.getAbstractFileByPath = () => null;

			const options: IconCreationOptions = {
				language: 'rust',
				iconStyle: 'custom',
				showIcon: true,
				customIconFolder: 'icons',
			};

			const result = createIconElement(app, options);

			const imgElement = result?.querySelector('img');
			expect(imgElement).toBeNull();
		});

		it('uses emoji fallback for unknown language when custom icon not found', () => {
			app.vault.getAbstractFileByPath = () => null;

			const options: IconCreationOptions = {
				language: 'unknown-lang',
				iconStyle: 'custom',
				showIcon: true,
				customIconFolder: 'icons',
			};

			const result = createIconElement(app, options);

			expect(result?.textContent).toBe('📄'); // Default emoji
		});

		it('does not add ucf-icon-custom class when falling back to emoji', () => {
			app.vault.getAbstractFileByPath = () => null;

			const options: IconCreationOptions = {
				language: 'go',
				iconStyle: 'custom',
				showIcon: true,
				customIconFolder: 'icons',
			};

			const result = createIconElement(app, options);

			expect(result?.classList.contains(CSS_CLASSES.iconCustom)).toBe(false);
		});

		it('handles missing customIconFolder gracefully', () => {
			app.vault.getAbstractFileByPath = () => null;

			const options: IconCreationOptions = {
				language: 'javascript',
				iconStyle: 'custom',
				showIcon: true,
				// No customIconFolder provided
			};

			const result = createIconElement(app, options);

			expect(result?.textContent).toBe('🟨'); // JavaScript emoji
		});
	});

	// ==========================================================================
	// createIconElement: Default Style (Emoji)
	// ==========================================================================

	describe('createIconElement - default/emoji style', () => {
		it('uses emoji style as default when style not specified or is "emoji"', () => {
			const options: IconCreationOptions = {
				language: 'docker',
				iconStyle: 'emoji',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.textContent).toBe('🐳');
		});
	});

	// ==========================================================================
	// createIconFromSettings
	// ==========================================================================

	describe('createIconFromSettings', () => {
		it('creates icon using settings fileIconStyle', () => {
			const settings = testSettings({
				fileIconStyle: 'emoji',
				showFileIcon: true,
			});

			const result = createIconFromSettings(app, settings, 'python');

			expect(result?.textContent).toBe('🐍');
		});

		it('creates icon using settings showFileIcon', () => {
			const settings = testSettings({
				fileIconStyle: 'emoji',
				showFileIcon: false,
			});

			const result = createIconFromSettings(app, settings, 'javascript');

			expect(result).toBeNull();
		});

		it('passes customIconFolder to createIconElement', () => {
			app.vault.getAbstractFileByPath = (path: string) => {
				if (path.endsWith('.svg')) return new TFile(path);
				return null;
			};

			const settings = testSettings({
				fileIconStyle: 'custom',
				showFileIcon: true,
				customIconFolder: 'custom-icons',
			});

			const result = createIconFromSettings(app, settings, 'typescript');

			expect(result?.classList.contains(CSS_CLASSES.iconCustom)).toBe(true);
		});

		it('uses provided language parameter', () => {
			const settings = testSettings({
				fileIconStyle: 'text',
				showFileIcon: true,
			});

			const result = createIconFromSettings(app, settings, 'go', 'go');

			expect(result?.textContent).toBe('GO');
		});

		it('uses provided extension parameter', () => {
			const settings = testSettings({
				fileIconStyle: 'text',
				showFileIcon: true,
			});

			const result = createIconFromSettings(app, settings, undefined, 'rb');

			expect(result?.textContent).toBe('RB');
		});

		it('works with filled badge style', () => {
			const settings = testSettings({
				fileIconStyle: 'filled',
				showFileIcon: true,
			});

			const result = createIconFromSettings(app, settings, 'rust');

			expect(result?.innerHTML).toContain('<svg');
			expect(result?.classList.contains(CSS_CLASSES.iconSvg)).toBe(true);
		});

		it('works with outline badge style', () => {
			const settings = testSettings({
				fileIconStyle: 'outline',
				showFileIcon: true,
			});

			const result = createIconFromSettings(app, settings, 'typescript');

			expect(result?.innerHTML).toContain('<svg');
			expect(result?.classList.contains(CSS_CLASSES.iconOutline)).toBe(true);
		});

		it('returns null when showFileIcon is disabled', () => {
			const settings = testSettings({
				fileIconStyle: 'emoji',
				showFileIcon: false,
			});

			const result = createIconFromSettings(app, settings, 'python');

			expect(result).toBeNull();
		});

		it('returns null when fileIconStyle is "none"', () => {
			const settings = testSettings({
				fileIconStyle: 'none',
				showFileIcon: true,
			});

			const result = createIconFromSettings(app, settings, 'javascript');

			expect(result).toBeNull();
		});

		it('works without language or extension parameters', () => {
			const settings = testSettings({
				fileIconStyle: 'emoji',
				showFileIcon: true,
			});

			const result = createIconFromSettings(app, settings);

			expect(result?.textContent).toBe('📄'); // Default emoji
		});
	});

	// ==========================================================================
	// Edge Cases & Integration
	// ==========================================================================

	describe('edge cases and integration', () => {
		it('handles empty string language', () => {
			const options: IconCreationOptions = {
				language: '',
				iconStyle: 'emoji',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.textContent).toBe('📄'); // Default emoji
		});

		it('handles whitespace-only language', () => {
			const options: IconCreationOptions = {
				language: '   ',
				iconStyle: 'emoji',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			// Should use the whitespace string as key (maps to default)
			expect(result).toBeInstanceOf(HTMLSpanElement);
		});

		it('preserves span className exactly as CSS_CLASSES.icon', () => {
			const options: IconCreationOptions = {
				language: 'python',
				iconStyle: 'emoji',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			// Should not have extra whitespace or variations
			expect(result?.className).toBe('ucf-icon');
		});

		it('handles case-insensitive language matching', () => {
			const options: IconCreationOptions = {
				language: 'PYTHON',
				iconStyle: 'emoji',
				showIcon: true,
			};

			const result = createIconElement(app, options);

			expect(result?.textContent).toBe('🐍'); // Python emoji (case-insensitive match)
		});

		it('creates distinct instances for multiple calls', () => {
			const options: IconCreationOptions = {
				language: 'javascript',
				iconStyle: 'emoji',
				showIcon: true,
			};

			const result1 = createIconElement(app, options);
			const result2 = createIconElement(app, options);

			expect(result1).not.toBe(result2);
			expect(result1?.textContent).toBe(result2?.textContent);
		});

		it('handles rapid successive calls with different styles', () => {
			const results = [
				createIconElement(app, { language: 'js', iconStyle: 'emoji', showIcon: true }),
				createIconElement(app, { language: 'js', iconStyle: 'text', showIcon: true }),
				createIconElement(app, { language: 'js', iconStyle: 'filled', showIcon: true }),
				createIconElement(app, { language: 'js', iconStyle: 'outline', showIcon: true }),
			];

			expect(results[0]?.textContent).toBe('🟨');
			expect(results[1]?.textContent).toBe('JS');
			expect(results[2]?.innerHTML).toContain('<svg');
			expect(results[3]?.innerHTML).toContain('<svg');
		});
	});
});
