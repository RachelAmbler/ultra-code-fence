/**
 * Ultra Code Fence - Icon Generator
 *
 * Generates visual icons for file types in various styles. Supports
 * emoji, text labels, filled badges, outline badges, and custom
 * user-provided icons.
 */

import { App, TFile } from 'obsidian';
import type { FileIconStyle, PluginSettings } from '../types';
import {
	getIconColour,
	getIconLabel,
	getIconEmoji,
	CSS_CLASSES,
	ICON_IMAGE_EXTENSIONS,
} from '../constants';

// =============================================================================
// SVG Generation
// =============================================================================

/**
 * Calculates font size based on label length.
 *
 * Longer labels need smaller fonts to fit within the badge.
 *
 * @param labelLength - Number of characters in the label
 * @returns Font size in SVG units
 */
export function calculateBadgeFontSize(labelLength: number): number {
	if (labelLength >= 5) return 5;
	if (labelLength >= 4) return 6;
	if (labelLength >= 3) return 7;
	if (labelLength >= 2) return 8;
	return 10;
}

/**
 * Generates a filled SVG icon with coloured background.
 *
 * Creates a rounded rectangle badge with the label text centred.
 * Text colour is white, except for yellow backgrounds where black
 * provides better contrast.
 *
 * @param label - Text label to display (e.g., "PY", "JS")
 * @param backgroundColour - Background colour as hex string
 * @returns SVG markup string
 */
export function generateFilledBadgeSvg(label: string, backgroundColour: string): string {
	const fontSize = calculateBadgeFontSize(label.length);

	// Use dark text on light backgrounds (yellow)
	const textColour = backgroundColour === '#eab308' ? '#000000' : '#ffffff';

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
		<rect x="2" y="2" width="20" height="20" rx="4" fill="${backgroundColour}"/>
		<text x="12" y="15" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="600" fill="${textColour}" text-anchor="middle">${label}</text>
	</svg>`;
}

/**
 * Generates an outline SVG icon that adapts to theme.
 *
 * Uses currentColor for both border and text, allowing the icon
 * to automatically match the surrounding text colour in any theme.
 *
 * @param label - Text label to display
 * @returns SVG markup string
 */
export function generateOutlineBadgeSvg(label: string): string {
	const fontSize = calculateBadgeFontSize(label.length);

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
		<rect x="2.5" y="2.5" width="19" height="19" rx="3.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
		<text x="12" y="15" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="600" fill="currentColor" text-anchor="middle">${label}</text>
	</svg>`;
}

// =============================================================================
// Custom Icon Resolution
// =============================================================================

/**
 * Searches for a custom icon file in the configured folder.
 *
 * Looks for files matching the language name with supported image
 * extensions (svg, png, jpg, etc.).
 *
 * @param app - Obsidian App instance
 * @param iconFolder - Vault folder containing custom icons
 * @param language - Language or extension to find icon for
 * @returns Path to the icon file, or null if not found
 */
export function findCustomIconPath(
	app: App,
	iconFolder: string,
	language: string | undefined
): string | null {
	if (!language || !iconFolder) {
		return null;
	}

	const key = language.toLowerCase();
	const normalisedFolder = iconFolder.replace(/\/$/, ''); // Remove trailing slash

	for (const ext of ICON_IMAGE_EXTENSIONS) {
		const iconPath = `${normalisedFolder}/${key}.${ext}`;
		const file = app.vault.getAbstractFileByPath(iconPath);

		if (file instanceof TFile) {
			return iconPath;
		}
	}

	return null;
}

/**
 * Gets the resource URL for a vault file.
 *
 * @param app - Obsidian App instance
 * @param vaultPath - Vault path to the file
 * @returns URL string for embedding in HTML
 */
export function getVaultResourceUrl(app: App, vaultPath: string): string {
	return app.vault.adapter.getResourcePath(vaultPath);
}

// =============================================================================
// Icon Element Creation
// =============================================================================

/**
 * Options for creating an icon element.
 */
export interface IconCreationOptions {
	/** Programming language or file extension */
	language?: string;

	/** File extension (fallback if language not provided) */
	extension?: string;

	/** Icon style to use */
	iconStyle: FileIconStyle;

	/** Whether icons are enabled */
	showIcon: boolean;

	/** Folder containing custom icons */
	customIconFolder?: string;
}

/**
 * Creates an icon element based on the configured style.
 *
 * Returns null if icons are disabled. For custom style, falls back
 * to emoji if no custom icon is found.
 *
 * @param app - Obsidian App instance
 * @param options - Icon configuration options
 * @returns HTMLSpanElement containing the icon, or null
 */
export function createIconElement(app: App, options: IconCreationOptions): HTMLSpanElement | null {
	const { language, extension, iconStyle, showIcon, customIconFolder } = options;

	if (!showIcon || iconStyle === 'none') {
		return null;
	}

	const iconContainer = document.createElement('span');
	iconContainer.className = CSS_CLASSES.icon;

	const languageKey = language || extension;

	switch (iconStyle) {
		case 'custom':
			return buildCustomIcon(app, iconContainer, languageKey, customIconFolder);

		case 'filled':
			return buildFilledBadgeIcon(iconContainer, languageKey, extension);

		case 'outline':
			return buildOutlineBadgeIcon(iconContainer, languageKey, extension);

		case 'text':
			return buildTextLabelIcon(iconContainer, languageKey, extension);

		case 'emoji':
		default:
			return buildEmojiIcon(iconContainer, languageKey);
	}
}

/**
 * Creates an icon using a custom image file.
 */
function buildCustomIcon(
	app: App,
	iconContainer: HTMLSpanElement,
	languageKey: string | undefined,
	customIconFolder: string | undefined
): HTMLSpanElement {
	const iconPath = findCustomIconPath(app, customIconFolder || '', languageKey);

	if (iconPath) {
		const imgElement = document.createElement('img');
		imgElement.className = CSS_CLASSES.iconImg;
		imgElement.src = getVaultResourceUrl(app, iconPath);
		imgElement.alt = languageKey || 'file';
		iconContainer.appendChild(imgElement);
		iconContainer.classList.add(CSS_CLASSES.iconCustom);
	} else {
		// Fallback to emoji if no custom icon found
		iconContainer.textContent = getIconEmoji(languageKey);
	}

	return iconContainer;
}

/**
 * Creates a filled badge icon.
 */
function buildFilledBadgeIcon(
	iconContainer: HTMLSpanElement,
	languageKey: string | undefined,
	extension: string | undefined
): HTMLSpanElement {
	const label = getIconLabel(languageKey, extension);
	const colour = getIconColour(languageKey);
	const svgMarkup = generateFilledBadgeSvg(label, colour);

	iconContainer.innerHTML = svgMarkup;
	iconContainer.classList.add(CSS_CLASSES.iconSvg);

	return iconContainer;
}

/**
 * Creates an outline badge icon.
 */
function buildOutlineBadgeIcon(
	iconContainer: HTMLSpanElement,
	languageKey: string | undefined,
	extension: string | undefined
): HTMLSpanElement {
	const label = getIconLabel(languageKey, extension);
	const svgMarkup = generateOutlineBadgeSvg(label);

	iconContainer.innerHTML = svgMarkup;
	iconContainer.classList.add(CSS_CLASSES.iconSvg, CSS_CLASSES.iconOutline);

	return iconContainer;
}

/**
 * Creates a text label icon.
 */
function buildTextLabelIcon(
	iconContainer: HTMLSpanElement,
	languageKey: string | undefined,
	extension: string | undefined
): HTMLSpanElement {
	iconContainer.textContent = getIconLabel(languageKey, extension);
	iconContainer.classList.add(CSS_CLASSES.iconText);

	return iconContainer;
}

/**
 * Creates an emoji icon.
 */
function buildEmojiIcon(
	iconContainer: HTMLSpanElement,
	languageKey: string | undefined
): HTMLSpanElement {
	iconContainer.textContent = getIconEmoji(languageKey);
	return iconContainer;
}

// =============================================================================
// Convenience Function
// =============================================================================

/**
 * Creates an icon element using plugin settings.
 *
 * Convenience wrapper that extracts relevant settings and calls
 * createIconElement.
 *
 * @param app - Obsidian App instance
 * @param settings - Plugin settings
 * @param language - Programming language
 * @param extension - File extension
 * @returns Icon element or null
 */
export function createIconFromSettings(
	app: App,
	settings: PluginSettings,
	language?: string,
	extension?: string
): HTMLSpanElement | null {
	return createIconElement(app, {
		language,
		extension,
		iconStyle: settings.fileIconStyle,
		showIcon: settings.showFileIcon,
		customIconFolder: settings.customIconFolder,
	});
}
