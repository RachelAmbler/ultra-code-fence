/**
 * Ultra Code Fence - Title Bar Renderer
 *
 * Creates the title bar element that sits above code blocks.
 * Supports multiple visual styles and optional descriptions.
 */

import { App, MarkdownRenderer, Component, TFile } from 'obsidian';
import type { TitleBarStyle, SourceFileMetadata, PluginSettings, DescriptionDisplayMode } from '../types';
import { CSS_CLASSES, styleClass } from '../constants';
import { createIconFromSettings } from '../services';
import { formatFileSize, calculateRelativeTime } from '../utils';

// =============================================================================
// Title Element Creation
// =============================================================================

/**
 * Options for creating a title element.
 */
export interface TitleBarCreationOptions {
	/** Title text to display */
	titleText: string;

	/** Path for click-to-open functionality */
	clickablePath?: string;

	/** Visual style for the title bar */
	titleBarStyle: TitleBarStyle;

	/** File metadata (for infobar style) */
	fileMetadata?: SourceFileMetadata;

	/** Programming language (for icon) */
	language?: string;

	/** Description text (supports markdown) */
	descriptionText?: string;

	/** Path of the containing note (for wiki links) */
	containingNotePath?: string;
}

/**
 * Creates a title element with the specified style.
 *
 * @param app - Obsidian App instance
 * @param settings - Plugin settings
 * @param options - Title configuration
 * @param component - Component for markdown rendering lifecycle
 * @returns Title element ready for insertion
 */
export async function createTitleBarElement(
	app: App,
	settings: PluginSettings,
	options: TitleBarCreationOptions,
	_component: Component
): Promise<HTMLDivElement> {
	const { titleText, clickablePath, titleBarStyle, fileMetadata, language } = options;

	const titleElement = document.createElement('div');
	titleElement.className = `${CSS_CLASSES.title} ${styleClass(titleBarStyle)}`;

	// Add file icon if enabled
	const iconElement = createIconFromSettings(app, settings, language, fileMetadata?.extension);

	if (iconElement) {
		titleElement.appendChild(iconElement);
	}

	// Build structure based on style
	if (titleBarStyle === 'infobar') {
		buildInfobarTitleLayout(titleElement, titleText, fileMetadata, clickablePath, settings, iconElement);
	} else {
		buildStandardTitleLayout(titleElement, titleText, clickablePath, settings);
	}

	// Make title clickable if path provided
	if (clickablePath) {
		setupTitleClickHandler(app, titleElement, clickablePath);
	}

	return titleElement;
}

/**
 * Builds the infobar style title (icon + text on left, metadata on right).
 */
function buildInfobarTitleLayout(
	titleElement: HTMLDivElement,
	titleText: string,
	fileMetadata: SourceFileMetadata | undefined,
	clickablePath: string | undefined,
	settings: PluginSettings,
	existingIcon: HTMLSpanElement | null
): void {
	// Left side: icon + text
	const leftGroup = document.createElement('div');
	leftGroup.className = CSS_CLASSES.titleLeft;

	// Move existing icon to left group if present
	if (existingIcon && titleElement.contains(existingIcon)) {
		leftGroup.appendChild(existingIcon);
	}

	const textSpan = document.createElement('span');
	textSpan.className = CSS_CLASSES.titleText;
	textSpan.textContent = titleText;
	leftGroup.appendChild(textSpan);

	titleElement.appendChild(leftGroup);

	// Right side: metadata
	if (fileMetadata) {
		const metadataGroup = buildMetadataGroup(fileMetadata);

		if (metadataGroup.children.length > 0) {
			titleElement.appendChild(metadataGroup);
		}
	}

	// Link indicator at the end
	if (settings.showLinkIndicator && clickablePath) {
		const linkIndicator = createLinkIndicatorElement();
		titleElement.appendChild(linkIndicator);
	}
}

/**
 * Builds standard title styles (tab, integrated, minimal).
 */
function buildStandardTitleLayout(
	titleElement: HTMLDivElement,
	titleText: string,
	clickablePath: string | undefined,
	settings: PluginSettings
): void {
	const textSpan = document.createElement('span');
	textSpan.className = CSS_CLASSES.titleText;
	textSpan.textContent = titleText;
	titleElement.appendChild(textSpan);

	// Add link indicator if enabled and path exists
	if (settings.showLinkIndicator && clickablePath) {
		const linkIndicator = createLinkIndicatorElement();
		titleElement.appendChild(linkIndicator);
	}
}

/**
 * Creates the metadata group for infobar style.
 */
function buildMetadataGroup(fileMetadata: SourceFileMetadata): HTMLDivElement {
	const metadataGroup = document.createElement('div');
	metadataGroup.className = CSS_CLASSES.titleMeta;

	if (fileMetadata.sizeInBytes !== undefined) {
		const sizeSpan = document.createElement('span');
		sizeSpan.textContent = formatFileSize(fileMetadata.sizeInBytes);
		metadataGroup.appendChild(sizeSpan);
	}

	if (fileMetadata.modifiedTime) {
		const timeSpan = document.createElement('span');
		timeSpan.textContent = calculateRelativeTime(fileMetadata.modifiedTime);
		metadataGroup.appendChild(timeSpan);
	}

	return metadataGroup;
}

/**
 * Creates a link indicator element.
 */
function createLinkIndicatorElement(): HTMLSpanElement {
	const indicator = document.createElement('span');
	indicator.className = CSS_CLASSES.linkIndicator;
	indicator.textContent = '↗';
	return indicator;
}

/**
 * Sets up click handler for opening source files.
 */
function setupTitleClickHandler(app: App, titleElement: HTMLDivElement, clickablePath: string): void {
	titleElement.setAttribute('title', `Click to open: ${clickablePath}`);

	titleElement.addEventListener('click', async (event) => {
		event.preventDefault();

		if (clickablePath.startsWith('https://') || clickablePath.startsWith('http://')) {
			// Open remote URLs in browser
			window.open(clickablePath, '_blank');
		} else {
			// Open vault files in Obsidian
			const file = app.vault.getAbstractFileByPath(clickablePath);

			if (file instanceof TFile) {
				// Ctrl/Cmd+click opens in new pane
				const openInNewPane = event.ctrlKey || event.metaKey;
				await app.workspace.getLeaf(openInNewPane).openFile(file);
			}
		}
	});
}

// =============================================================================
// Description Rendering
// =============================================================================

/**
 * Creates a description element displayed below the title.
 *
 * @param app - Obsidian App instance
 * @param descriptionText - Description text (markdown supported)
 * @param containingNotePath - Path of containing note for wiki links
 * @param component - Component for markdown rendering lifecycle
 * @returns Description element
 */
export async function createDescriptionElement(
	app: App,
	descriptionText: string,
	containingNotePath: string,
	component: Component
): Promise<HTMLDivElement> {
	const descriptionElement = document.createElement('div');
	descriptionElement.className = CSS_CLASSES.description;

	await MarkdownRenderer.render(
		app,
		descriptionText,
		descriptionElement,
		containingNotePath,
		component
	);

	return descriptionElement;
}

/**
 * Creates a tooltip container for hover descriptions.
 *
 * @param app - Obsidian App instance
 * @param descriptionText - Description text
 * @param containingNotePath - Path of containing note
 * @param component - Component for markdown rendering lifecycle
 * @returns Tooltip container element
 */
export async function createTooltipDescriptionElement(
	app: App,
	descriptionText: string,
	containingNotePath: string,
	component: Component
): Promise<HTMLDivElement> {
	const tooltipContainer = document.createElement('div');
	tooltipContainer.className = CSS_CLASSES.tooltipContainer;

	const tooltipContent = document.createElement('div');
	tooltipContent.className = CSS_CLASSES.tooltipContent;

	await MarkdownRenderer.render(
		app,
		descriptionText,
		tooltipContent,
		containingNotePath,
		component
	);

	tooltipContainer.appendChild(tooltipContent);

	return tooltipContainer;
}

// =============================================================================
// Container Assembly
// =============================================================================

/**
 * Options for building a complete code block container.
 */
export interface TitleContainerOptions extends TitleBarCreationOptions {
	/** Whether to hide the title */
	hideTitle: boolean;

	/** Whether to use theme colours */
	useThemeColours: boolean;

	/** Custom background colour */
	backgroundColour?: string;

	/** Custom text colour */
	textColour?: string;

	/** Description display mode */
	descriptionDisplayMode: DescriptionDisplayMode;

	/** Custom description colour */
	descriptionColour?: string;

	/** Whether to italicise description */
	descriptionItalic: boolean;
}

/**
 * Builds a complete container with title and description.
 *
 * @param app - Obsidian App instance
 * @param settings - Plugin settings
 * @param options - Container configuration
 * @param component - Component for markdown rendering
 * @returns Container with title and optional description
 */
export async function buildTitleContainer(
	app: App,
	settings: PluginSettings,
	options: TitleContainerOptions,
	component: Component
): Promise<HTMLDivElement> {
	const container = document.createElement('div');
	container.className = `${CSS_CLASSES.container} ${styleClass(options.titleBarStyle)}`;

	// Apply custom colours if not using theme
	if (!options.useThemeColours) {
		container.classList.add('custom-colors');

		if (options.backgroundColour) {
			container.style.setProperty('--custom-bg', options.backgroundColour);
		}

		if (options.textColour) {
			container.style.setProperty('--custom-fg', options.textColour);
		}
	}

	// Create title element
	const titleElement = await createTitleBarElement(app, settings, options, component);
	container.appendChild(titleElement);

	// Handle description
	if (options.descriptionText && options.descriptionDisplayMode !== 'none') {
		// Apply description styling
		if (options.descriptionColour) {
			container.style.setProperty('--ucf-desc-color', options.descriptionColour);
		}

		if (options.descriptionItalic) {
			container.classList.add(CSS_CLASSES.descItalic);
		}

		if (options.descriptionDisplayMode === 'tooltip') {
			const tooltipElement = await createTooltipDescriptionElement(
				app,
				options.descriptionText,
				options.containingNotePath || '',
				component
			);
			titleElement.appendChild(tooltipElement);
			titleElement.classList.add(CSS_CLASSES.hasTooltip);
		} else {
			// Below title
			const descriptionElement = await createDescriptionElement(
				app,
				options.descriptionText,
				options.containingNotePath || '',
				component
			);
			container.appendChild(descriptionElement);
		}
	}

	return container;
}
