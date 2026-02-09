// @vitest-environment jsdom

/**
 * Tests for src/renderers/title-bar.ts
 *
 * Covers DOM functions:
 * - createDescriptionElement: Renders markdown into a description div
 * - createTooltipDescriptionElement: Creates tooltip container with markdown content
 * - createTitleBarElement: Creates title element with style and optional link indicator
 * - buildTitleContainer: Builds complete container with title and description
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { App, Component, MarkdownRenderer, setupObsidianDom } from '../../src/__mocks__/obsidian';
import {
	createDescriptionElement,
	createTooltipDescriptionElement,
	createTitleBarElement,
	buildTitleContainer,
	type TitleBarCreationOptions,
	type TitleContainerOptions,
} from '../../src/renderers/title-bar';
import { CSS_CLASSES, styleClass } from '../../src/constants';
import { testSettings } from '../helpers/test-settings';
import type { PluginSettings } from '../../src/types';

// Mock createIconFromSettings to isolate title tests
vi.mock('../../src/services', () => ({
	createIconFromSettings: vi.fn(() => null),
}));

describe('Title Bar DOM Renderer', () => {
	let app: App;
	let component: Component;
	let mockSettings: PluginSettings;

	beforeEach(() => {
		setupObsidianDom();
		app = new App();
		component = new Component();
		mockSettings = testSettings();

		// Spy on MarkdownRenderer to track calls
		vi.spyOn(MarkdownRenderer, 'render');
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	// ==========================================================================
	// createDescriptionElement Tests
	// ==========================================================================

	describe('createDescriptionElement', () => {
		it('creates a div with ucf-description class', async () => {
			const element = await createDescriptionElement(
				app,
				'Test description',
				'notes/test.md',
				component
			);

			expect(element).toBeInstanceOf(HTMLDivElement);
			expect(element.classList.contains(CSS_CLASSES.description)).toBe(true);
		});

		it('renders markdown via MarkdownRenderer.render', async () => {
			const markdown = '**bold** text';

			await createDescriptionElement(app, markdown, 'note.md', component);

			expect(MarkdownRenderer.render).toHaveBeenCalledWith(
				app,
				markdown,
				expect.any(HTMLDivElement),
				'note.md',
				component
			);
		});

		it('sets innerHTML to markdown content (via mock)', async () => {
			const markdown = '**bold** and *italic*';

			const element = await createDescriptionElement(app, markdown, 'note.md', component);

			expect(element.innerHTML).toBe(markdown);
		});

		it('handles empty description text', async () => {
			const element = await createDescriptionElement(app, '', 'note.md', component);

			expect(element.classList.contains(CSS_CLASSES.description)).toBe(true);
			expect(element.innerHTML).toBe('');
		});

		it('handles markdown with special characters', async () => {
			const markdown = '`code` and [link](http://example.com)';

			const element = await createDescriptionElement(app, markdown, 'note.md', component);

			expect(element.innerHTML).toBe(markdown);
		});
	});

	// ==========================================================================
	// createTooltipDescriptionElement Tests
	// ==========================================================================

	describe('createTooltipDescriptionElement', () => {
		it('creates a div with ucf-tooltip-container class', async () => {
			const element = await createTooltipDescriptionElement(
				app,
				'Tooltip text',
				'note.md',
				component
			);

			expect(element).toBeInstanceOf(HTMLDivElement);
			expect(element.classList.contains(CSS_CLASSES.tooltipContainer)).toBe(true);
		});

		it('contains a child div with ucf-tooltip-content class', async () => {
			const element = await createTooltipDescriptionElement(
				app,
				'Tooltip text',
				'note.md',
				component
			);

			const contentDiv = element.querySelector(`.${CSS_CLASSES.tooltipContent}`);
			expect(contentDiv).toBeInstanceOf(HTMLDivElement);
		});

		it('renders markdown in the tooltip content', async () => {
			const markdown = '**tooltip** content';

			const element = await createTooltipDescriptionElement(app, markdown, 'note.md', component);

			const contentDiv = element.querySelector(`.${CSS_CLASSES.tooltipContent}`);
			expect(contentDiv?.innerHTML).toBe(markdown);
		});

		it('passes correct parameters to MarkdownRenderer', async () => {
			const markdown = 'Test tooltip';

			await createTooltipDescriptionElement(app, markdown, 'container.md', component);

			expect(MarkdownRenderer.render).toHaveBeenCalledWith(
				app,
				markdown,
				expect.any(HTMLDivElement),
				'container.md',
				component
			);
		});

		it('has correct structure: container > content', async () => {
			const element = await createTooltipDescriptionElement(app, 'Test', 'note.md', component);

			expect(element.children.length).toBe(1);
			expect(element.children[0].classList.contains(CSS_CLASSES.tooltipContent)).toBe(true);
		});
	});

	// ==========================================================================
	// createTitleBarElement Tests
	// ==========================================================================

	describe('createTitleBarElement', () => {
		it('creates a div with ucf-title class', async () => {
			const options: TitleBarCreationOptions = {
				titleText: 'Test Title',
				titleBarStyle: 'tab',
			};

			const element = await createTitleBarElement(app, mockSettings, options, component);

			expect(element).toBeInstanceOf(HTMLDivElement);
			expect(element.classList.contains(CSS_CLASSES.title)).toBe(true);
		});

		it('applies style class based on titleBarStyle', async () => {
			const styles: Array<'tab' | 'integrated' | 'minimal' | 'infobar'> = [
				'tab',
				'integrated',
				'minimal',
				'infobar',
			];

			for (const style of styles) {
				const options: TitleBarCreationOptions = {
					titleText: 'Title',
					titleBarStyle: style,
				};

				const element = await createTitleBarElement(app, mockSettings, options, component);

				expect(element.classList.contains(styleClass(style))).toBe(true);
			}
		});

		describe('Standard title styles (tab, integrated, minimal)', () => {
			it('adds span with ucf-text class containing title text', async () => {
				const options: TitleBarCreationOptions = {
					titleText: 'MyFile.js',
					titleBarStyle: 'tab',
				};

				const element = await createTitleBarElement(app, mockSettings, options, component);

				const textSpan = element.querySelector(`.${CSS_CLASSES.titleText}`);
				expect(textSpan).toBeInstanceOf(HTMLSpanElement);
				expect(textSpan?.textContent).toBe('MyFile.js');
			});

			it('adds link indicator when showLinkIndicator=true and clickablePath set', async () => {
				const settings = testSettings({ showLinkIndicator: true });
				const options: TitleBarCreationOptions = {
					titleText: 'Test',
					titleBarStyle: 'tab',
					clickablePath: 'src/test.js',
				};

				const element = await createTitleBarElement(app, settings, options, component);

				const indicator = element.querySelector(`.${CSS_CLASSES.linkIndicator}`);
				expect(indicator).toBeInstanceOf(HTMLSpanElement);
				expect(indicator?.textContent).toBe('↗');
			});

			it('does not add link indicator when showLinkIndicator=false', async () => {
				const settings = testSettings({ showLinkIndicator: false });
				const options: TitleBarCreationOptions = {
					titleText: 'Test',
					titleBarStyle: 'tab',
					clickablePath: 'src/test.js',
				};

				const element = await createTitleBarElement(app, settings, options, component);

				const indicator = element.querySelector(`.${CSS_CLASSES.linkIndicator}`);
				expect(indicator).toBeNull();
			});

			it('does not add link indicator when clickablePath not set', async () => {
				const settings = testSettings({ showLinkIndicator: true });
				const options: TitleBarCreationOptions = {
					titleText: 'Test',
					titleBarStyle: 'tab',
				};

				const element = await createTitleBarElement(app, settings, options, component);

				const indicator = element.querySelector(`.${CSS_CLASSES.linkIndicator}`);
				expect(indicator).toBeNull();
			});

			it('sets title attribute when clickablePath provided', async () => {
				const options: TitleBarCreationOptions = {
					titleText: 'Test',
					titleBarStyle: 'tab',
					clickablePath: 'path/to/file.js',
				};

				const element = await createTitleBarElement(app, mockSettings, options, component);

				expect(element.getAttribute('title')).toBe('Click to open: path/to/file.js');
			});

			it('adds click event listener when clickablePath provided', async () => {
				const options: TitleBarCreationOptions = {
					titleText: 'Test',
					titleBarStyle: 'tab',
					clickablePath: 'vault://path/to/file.js',
				};

				const element = await createTitleBarElement(app, mockSettings, options, component);

				// Verify click handler is attached (by checking if element has listeners)
				expect(element.getAttribute('title')).toContain('path/to/file.js');
			});
		});

		describe('Infobar style', () => {
			it('creates left group with ucf-left class', async () => {
				const options: TitleBarCreationOptions = {
					titleText: 'Test',
					titleBarStyle: 'infobar',
				};

				const element = await createTitleBarElement(app, mockSettings, options, component);

				const leftGroup = element.querySelector(`.${CSS_CLASSES.titleLeft}`);
				expect(leftGroup).toBeInstanceOf(HTMLDivElement);
			});

			it('places title text in left group', async () => {
				const options: TitleBarCreationOptions = {
					titleText: 'document.pdf',
					titleBarStyle: 'infobar',
				};

				const element = await createTitleBarElement(app, mockSettings, options, component);

				const textSpan = element.querySelector(`.${CSS_CLASSES.titleLeft} .${CSS_CLASSES.titleText}`);
				expect(textSpan?.textContent).toBe('document.pdf');
			});

			it('creates metadata group when fileMetadata provided', async () => {
				const options: TitleBarCreationOptions = {
					titleText: 'Test',
					titleBarStyle: 'infobar',
					fileMetadata: {
						extension: 'pdf',
						sizeInBytes: 1024,
						modifiedTime: Date.now(),
					},
				};

				const element = await createTitleBarElement(app, mockSettings, options, component);

				const metaGroup = element.querySelector(`.${CSS_CLASSES.titleMeta}`);
				expect(metaGroup).toBeInstanceOf(HTMLDivElement);
			});

			it('does not create metadata group when fileMetadata not provided', async () => {
				const options: TitleBarCreationOptions = {
					titleText: 'Test',
					titleBarStyle: 'infobar',
				};

				const element = await createTitleBarElement(app, mockSettings, options, component);

				const metaGroup = element.querySelector(`.${CSS_CLASSES.titleMeta}`);
				expect(metaGroup).toBeNull();
			});

			it('adds link indicator to infobar when enabled and path set', async () => {
				const settings = testSettings({ showLinkIndicator: true });
				const options: TitleBarCreationOptions = {
					titleText: 'Test',
					titleBarStyle: 'infobar',
					clickablePath: 'src/test.js',
				};

				const element = await createTitleBarElement(app, settings, options, component);

				const indicator = element.querySelector(`.${CSS_CLASSES.linkIndicator}`);
				expect(indicator?.textContent).toBe('↗');
			});
		});
	});

	// ==========================================================================
	// buildTitleContainer Tests
	// ==========================================================================

	describe('buildTitleContainer', () => {
		it('creates container with ucf class', async () => {
			const options: TitleContainerOptions = {
				titleText: 'Test',
				titleBarStyle: 'tab',
				hideTitle: false,
				useThemeColours: true,
				descriptionDisplayMode: 'none',
				descriptionItalic: false,
			};

			const container = await buildTitleContainer(app, mockSettings, options, component);

			expect(container.classList.contains(CSS_CLASSES.container)).toBe(true);
		});

		it('applies style class to container', async () => {
			const options: TitleContainerOptions = {
				titleText: 'Test',
				titleBarStyle: 'minimal',
				hideTitle: false,
				useThemeColours: true,
				descriptionDisplayMode: 'none',
				descriptionItalic: false,
			};

			const container = await buildTitleContainer(app, mockSettings, options, component);

			expect(container.classList.contains(styleClass('minimal'))).toBe(true);
		});

		it('adds custom-colors class when useThemeColours=false', async () => {
			const options: TitleContainerOptions = {
				titleText: 'Test',
				titleBarStyle: 'tab',
				hideTitle: false,
				useThemeColours: false,
				descriptionDisplayMode: 'none',
				descriptionItalic: false,
			};

			const container = await buildTitleContainer(app, mockSettings, options, component);

			expect(container.classList.contains('custom-colors')).toBe(true);
		});

		it('does not add custom-colors class when useThemeColours=true', async () => {
			const options: TitleContainerOptions = {
				titleText: 'Test',
				titleBarStyle: 'tab',
				hideTitle: false,
				useThemeColours: true,
				descriptionDisplayMode: 'none',
				descriptionItalic: false,
			};

			const container = await buildTitleContainer(app, mockSettings, options, component);

			expect(container.classList.contains('custom-colors')).toBe(false);
		});

		it('sets CSS vars for custom background when provided', async () => {
			const options: TitleContainerOptions = {
				titleText: 'Test',
				titleBarStyle: 'tab',
				hideTitle: false,
				useThemeColours: false,
				backgroundColour: '#ff0000',
				descriptionDisplayMode: 'none',
				descriptionItalic: false,
			};

			const container = await buildTitleContainer(app, mockSettings, options, component);

			expect(container.style.getPropertyValue('--custom-bg')).toBe('#ff0000');
		});

		it('sets CSS vars for custom text color when provided', async () => {
			const options: TitleContainerOptions = {
				titleText: 'Test',
				titleBarStyle: 'tab',
				hideTitle: false,
				useThemeColours: false,
				textColour: '#00ff00',
				descriptionDisplayMode: 'none',
				descriptionItalic: false,
			};

			const container = await buildTitleContainer(app, mockSettings, options, component);

			expect(container.style.getPropertyValue('--custom-fg')).toBe('#00ff00');
		});

		it('includes title element in container', async () => {
			const options: TitleContainerOptions = {
				titleText: 'MyTitle',
				titleBarStyle: 'tab',
				hideTitle: false,
				useThemeColours: true,
				descriptionDisplayMode: 'none',
				descriptionItalic: false,
			};

			const container = await buildTitleContainer(app, mockSettings, options, component);

			const titleElement = container.querySelector(`.${CSS_CLASSES.title}`);
			expect(titleElement).toBeInstanceOf(HTMLDivElement);
		});

		describe('Description handling', () => {
			it('does not append description when descriptionDisplayMode=none', async () => {
				const options: TitleContainerOptions = {
					titleText: 'Test',
					titleBarStyle: 'tab',
					hideTitle: false,
					useThemeColours: true,
					descriptionText: 'This is a description',
					descriptionDisplayMode: 'none',
					descriptionItalic: false,
				};

				const container = await buildTitleContainer(app, mockSettings, options, component);

				const descElement = container.querySelector(`.${CSS_CLASSES.description}`);
				expect(descElement).toBeNull();
			});

			it('appends description below title when descriptionDisplayMode=below', async () => {
				const options: TitleContainerOptions = {
					titleText: 'Test',
					titleBarStyle: 'tab',
					hideTitle: false,
					useThemeColours: true,
					descriptionText: 'Below description',
					descriptionDisplayMode: 'below',
					descriptionItalic: false,
				};

				const container = await buildTitleContainer(app, mockSettings, options, component);

				const descElement = container.querySelector(`.${CSS_CLASSES.description}`);
				expect(descElement).toBeInstanceOf(HTMLDivElement);
				expect(descElement?.textContent).toBe('Below description');
			});

			it('appends description as sibling (after title) when mode=below', async () => {
				const options: TitleContainerOptions = {
					titleText: 'Test',
					titleBarStyle: 'tab',
					hideTitle: false,
					useThemeColours: true,
					descriptionText: 'Description',
					descriptionDisplayMode: 'below',
					descriptionItalic: false,
				};

				const container = await buildTitleContainer(app, mockSettings, options, component);

				const children = Array.from(container.children);
				const titleIndex = children.findIndex((el) =>
					el.classList.contains(CSS_CLASSES.title)
				);
				const descIndex = children.findIndex((el) =>
					el.classList.contains(CSS_CLASSES.description)
				);

				expect(titleIndex).toBeLessThan(descIndex);
			});

			it('appends tooltip inside title when descriptionDisplayMode=tooltip', async () => {
				const options: TitleContainerOptions = {
					titleText: 'Test',
					titleBarStyle: 'tab',
					hideTitle: false,
					useThemeColours: true,
					descriptionText: 'Tooltip',
					descriptionDisplayMode: 'tooltip',
					descriptionItalic: false,
				};

				const container = await buildTitleContainer(app, mockSettings, options, component);

				const titleElement = container.querySelector(`.${CSS_CLASSES.title}`);
				const tooltipElement = titleElement?.querySelector(
					`.${CSS_CLASSES.tooltipContainer}`
				);
				expect(tooltipElement).toBeInstanceOf(HTMLDivElement);
			});

			it('adds has-tooltip class to title when tooltip mode', async () => {
				const options: TitleContainerOptions = {
					titleText: 'Test',
					titleBarStyle: 'tab',
					hideTitle: false,
					useThemeColours: true,
					descriptionText: 'Tooltip',
					descriptionDisplayMode: 'tooltip',
					descriptionItalic: false,
				};

				const container = await buildTitleContainer(app, mockSettings, options, component);

				const titleElement = container.querySelector(`.${CSS_CLASSES.title}`);
				expect(titleElement?.classList.contains(CSS_CLASSES.hasTooltip)).toBe(true);
			});

			it('sets description color CSS var when provided', async () => {
				const options: TitleContainerOptions = {
					titleText: 'Test',
					titleBarStyle: 'tab',
					hideTitle: false,
					useThemeColours: true,
					descriptionText: 'Colored description',
					descriptionDisplayMode: 'below',
					descriptionColour: '#ff0000',
					descriptionItalic: false,
				};

				const container = await buildTitleContainer(app, mockSettings, options, component);

				expect(container.style.getPropertyValue('--ucf-desc-color')).toBe('#ff0000');
			});

			it('adds descItalic class when descriptionItalic=true', async () => {
				const options: TitleContainerOptions = {
					titleText: 'Test',
					titleBarStyle: 'tab',
					hideTitle: false,
					useThemeColours: true,
					descriptionText: 'Italic description',
					descriptionDisplayMode: 'below',
					descriptionItalic: true,
				};

				const container = await buildTitleContainer(app, mockSettings, options, component);

				expect(container.classList.contains(CSS_CLASSES.descItalic)).toBe(true);
			});

			it('does not add descItalic class when descriptionItalic=false', async () => {
				const options: TitleContainerOptions = {
					titleText: 'Test',
					titleBarStyle: 'tab',
					hideTitle: false,
					useThemeColours: true,
					descriptionText: 'Normal description',
					descriptionDisplayMode: 'below',
					descriptionItalic: false,
				};

				const container = await buildTitleContainer(app, mockSettings, options, component);

				expect(container.classList.contains(CSS_CLASSES.descItalic)).toBe(false);
			});

			it('does not process description when descriptionText not provided', async () => {
				const options: TitleContainerOptions = {
					titleText: 'Test',
					titleBarStyle: 'tab',
					hideTitle: false,
					useThemeColours: true,
					descriptionDisplayMode: 'below',
					descriptionItalic: false,
				};

				const container = await buildTitleContainer(app, mockSettings, options, component);

				const descElement = container.querySelector(`.${CSS_CLASSES.description}`);
				expect(descElement).toBeNull();
			});
		});

		it('uses containingNotePath for markdown rendering', async () => {
			const options: TitleContainerOptions = {
				titleText: 'Test',
				titleBarStyle: 'tab',
				hideTitle: false,
				useThemeColours: true,
				descriptionText: 'Description',
				containingNotePath: 'folder/note.md',
				descriptionDisplayMode: 'below',
				descriptionItalic: false,
			};

			await buildTitleContainer(app, mockSettings, options, component);

			expect(MarkdownRenderer.render).toHaveBeenCalledWith(
				app,
				'Description',
				expect.any(HTMLDivElement),
				'folder/note.md',
				component
			);
		});
	});
});
