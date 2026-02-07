/**
 * Ultra Code Fence - Settings Tab
 *
 * Provides the configuration UI for the plugin. Organised into tabs
 * for different setting categories: General, Title, Code, Inline,
 * Command Output, and Appearance.
 */

import { App, Platform, PluginSettingTab, Setting } from 'obsidian';
import type { PluginSettings, TitleBarStyle, FileIconStyle, DescriptionDisplayMode, ReleaseNotesData } from '../types';
import { CSS_CLASSES } from '../constants';
import { WhatsNewModal } from './whats-new-modal';

// =============================================================================
// Types
// =============================================================================

/**
 * Plugin interface required by the settings tab.
 */
export interface SettingsPlugin {
	settings: PluginSettings;
	manifest: { version: string };
	saveSettings(): Promise<void>;
}

/**
 * Tab definition for the settings UI.
 */
interface SettingsTabDefinition {
	tabId: string;
	tabLabel: string;
}

// =============================================================================
// Settings Tab Implementation
// =============================================================================

/**
 * Settings tab for the Ultra Code Fence plugin.
 *
 * Provides a tabbed interface for configuring all plugin options.
 */
export class UltraCodeFenceSettingTab extends PluginSettingTab {
	private plugin: SettingsPlugin;
	private releaseNotesData: ReleaseNotesData;
	private activeTabId: string = 'general';

	/**
	 * Creates a new settings tab.
	 *
	 * @param app - Obsidian App instance
	 * @param plugin - Plugin instance
	 * @param releaseNotesData - Release notes data for the modal
	 */
	constructor(app: App, plugin: SettingsPlugin, releaseNotesData: ReleaseNotesData) {
		super(app, plugin as any);
		this.plugin = plugin;
		this.releaseNotesData = releaseNotesData;
	}

	/**
	 * Renders the settings tab UI.
	 */
	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass(CSS_CLASSES.settings);

		// Header
		containerEl.createEl('h2', { text: 'Ultra Code Fence' });

		// Tab navigation
		const tabContainer = containerEl.createEl('div', { cls: CSS_CLASSES.tabs });
		const tabContentContainer = containerEl.createEl('div', { cls: CSS_CLASSES.tabContent });

		const tabDefinitions: SettingsTabDefinition[] = [
			{ tabId: 'general', tabLabel: 'General' },
			{ tabId: 'title', tabLabel: 'Title' },
			{ tabId: 'code', tabLabel: 'Code' },
			{ tabId: 'inline', tabLabel: 'Inline' },
			{ tabId: 'cmdout', tabLabel: 'Cmd Output' },
			{ tabId: 'appearance', tabLabel: 'Appearance' },
		];

		// Render tabs and content
		const renderTabNavigation = () => {
			tabContainer.empty();

			for (const tab of tabDefinitions) {
				const tabButton = tabContainer.createEl('button', {
					text: tab.tabLabel,
					cls: `${CSS_CLASSES.tab} ${this.activeTabId === tab.tabId ? CSS_CLASSES.tabActive : ''}`,
				});

				tabButton.addEventListener('click', () => {
					this.activeTabId = tab.tabId;
					renderTabNavigation();
					renderTabContent();
				});
			}
		};

		const renderTabContent = () => {
			tabContentContainer.empty();

			switch (this.activeTabId) {
				case 'general':
					this.renderGeneralTab(tabContentContainer);
					break;
				case 'title':
					this.renderTitleTab(tabContentContainer);
					break;
				case 'code':
					this.renderCodeTab(tabContentContainer);
					break;
				case 'inline':
					this.renderInlineTab(tabContentContainer);
					break;
				case 'cmdout':
					this.renderCommandOutputTab(tabContentContainer);
					break;
				case 'appearance':
					this.renderAppearanceTab(tabContentContainer);
					break;
			}
		};

		renderTabNavigation();
		renderTabContent();
	}

	// ===========================================================================
	// Helper Methods
	// ===========================================================================

	/**
	 * Creates a section divider.
	 */
	private createSectionDivider(containerElement: HTMLElement): void {
		containerElement.createEl('hr', { cls: CSS_CLASSES.divider });
	}

	/**
	 * Creates a section header with optional description.
	 */
	private createSectionHeader(containerElement: HTMLElement, headerText: string, descriptionText?: string): void {
		containerElement.createEl('h4', { text: headerText, cls: CSS_CLASSES.sectionHeader });

		if (descriptionText) {
			containerElement.createEl('p', { text: descriptionText, cls: CSS_CLASSES.sectionDesc });
		}
	}

	// ===========================================================================
	// General Tab
	// ===========================================================================

	private renderGeneralTab(containerElement: HTMLElement): void {
		const pluginVersion = this.plugin.manifest.version;

		// What's New section
		this.createSectionHeader(containerElement, `What's new in version ${pluginVersion}`);

		const whatsNewBox = containerElement.createEl('div', { cls: CSS_CLASSES.whatsNewBox });
		whatsNewBox.createEl('p', {
			text: 'This plugin is a modernised fork of Embed Code File, updated with new features including title styles, line numbers, custom icons, and more.',
			cls: 'ucf-whats-new-summary',
		});

		const viewUpdatesButton = whatsNewBox.createEl('button', {
			text: 'View recent updates',
			cls: 'ucf-view-updates-btn',
		});
		viewUpdatesButton.addEventListener('click', () => {
			new WhatsNewModal(this.app, pluginVersion, this.releaseNotesData).open();
		});

		this.createSectionDivider(containerElement);

		// Languages section
		this.createSectionHeader(containerElement, 'Languages');

		new Setting(containerElement)
			.setName('Supported languages')
			.setDesc('Comma-separated list. Creates ufence-{lang} code blocks.')
			.addText(textInput => textInput
				.setPlaceholder('python,javascript,bash,...')
				.setValue(this.plugin.settings.supportedLanguages)
				.onChange(async (value) => {
					this.plugin.settings.supportedLanguages = value;
					await this.plugin.saveSettings();
				}));

		this.createSectionDivider(containerElement);

		// Path section
		this.createSectionHeader(containerElement, 'File Paths');

		new Setting(containerElement)
			.setName('Default path prefix')
			.setDesc('Prepended to PATH if not starting with vault:// or http')
			.addText(textInput => textInput
				.setPlaceholder('vault://Assets/Scripts/')
				.setValue(this.plugin.settings.defaultPathPrefix)
				.onChange(async (value) => {
					this.plugin.settings.defaultPathPrefix = value;
					await this.plugin.saveSettings();
				}));

		this.createSectionDivider(containerElement);

		// Help section
		this.createSectionHeader(containerElement, 'Template Variables', 'Use these in the Title template:');

		const helpGrid = containerElement.createEl('div', { cls: 'ucf-help-grid' });
		helpGrid.innerHTML = `
			<div class="ucf-help-group">
				<div class="ucf-help-label">File info</div>
				<code>{filename}</code> <code>{basename}</code> <code>{extension}</code> <code>{parentfolder}</code>
			</div>
			<div class="ucf-help-group">
				<div class="ucf-help-label">Size</div>
				<code>{size}</code> <code>{size:kb}</code> <code>{size:mb}</code>
			</div>
			<div class="ucf-help-group">
				<div class="ucf-help-label">Dates</div>
				<code>{modified:relative}</code> <code>{modified:short}</code> <code>{modified:iso}</code>
			</div>
			<div class="ucf-help-group">
				<div class="ucf-help-label">Formatting</div>
				<code>{filename:upper}</code> <code>{filename:lower}</code> <code>{filename:title}</code>
			</div>
		`;
	}

	// ===========================================================================
	// Title Tab
	// ===========================================================================

	private renderTitleTab(containerElement: HTMLElement): void {
		containerElement.createEl('p', {
			text: 'Configure how the title bar and description appear.',
			cls: CSS_CLASSES.tabIntro,
		});

		// Title section
		this.createSectionHeader(containerElement, 'Title Bar');

		new Setting(containerElement)
			.setName('Style')
			.setDesc('Override: RENDER.STYLE: "infobar"')
			.addDropdown(dropdown => dropdown
				.addOption('tab', 'Tab')
				.addOption('integrated', 'Integrated')
				.addOption('minimal', 'Minimal')
				.addOption('infobar', 'Info Bar')
				.addOption('none', 'Hidden')
				.setValue(this.plugin.settings.defaultTitleBarStyle)
				.onChange(async (value) => {
					this.plugin.settings.defaultTitleBarStyle = value as TitleBarStyle;
					await this.plugin.saveSettings();
				}));

		new Setting(containerElement)
			.setName('Title template')
			.setDesc('Override: META.TITLE: "{basename}"')
			.addText(textInput => textInput
				.setPlaceholder('{filename}')
				.setValue(this.plugin.settings.defaultTitleTemplate)
				.onChange(async (value) => {
					this.plugin.settings.defaultTitleTemplate = value;
					await this.plugin.saveSettings();
				}));

		this.createSectionDivider(containerElement);

		// Description section
		this.createSectionHeader(containerElement, 'Description');

		new Setting(containerElement)
			.setName('Display mode')
			.setDesc('Override: META.DESC: "your text here"')
			.addDropdown(dropdown => dropdown
				.addOption('below', 'Below title')
				.addOption('tooltip', 'Tooltip on hover')
				.addOption('none', 'Hidden')
				.setValue(this.plugin.settings.descriptionDisplayMode)
				.onChange(async (value) => {
					this.plugin.settings.descriptionDisplayMode = value as DescriptionDisplayMode;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide related settings
				}));

		if (this.plugin.settings.descriptionDisplayMode !== 'none') {
			new Setting(containerElement)
				.setName('Italic')
				.setDesc('Display description text in italics')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.descriptionItalic)
					.onChange(async (value) => {
						this.plugin.settings.descriptionItalic = value;
						await this.plugin.saveSettings();
					}));

			new Setting(containerElement)
				.setName('Colour')
				.setDesc('Custom colour for description text')
				.addColorPicker(picker => picker
					.setValue(this.plugin.settings.descriptionColour || '#888888')
					.onChange(async (value) => {
						this.plugin.settings.descriptionColour = value;
						await this.plugin.saveSettings();
					}))
				.addToggle(toggle => toggle
					.setTooltip('Use custom colour')
					.setValue(!!this.plugin.settings.descriptionColour)
					.onChange(async (value) => {
						this.plugin.settings.descriptionColour = value ? '#888888' : '';
						await this.plugin.saveSettings();
						this.display();
					}));
		}
	}

	// ===========================================================================
	// Code Tab
	// ===========================================================================

	private renderCodeTab(containerElement: HTMLElement): void {
		containerElement.createEl('p', {
			text: 'Configure code block formatting and behaviour.',
			cls: CSS_CLASSES.tabIntro,
		});

		// Display section
		this.createSectionHeader(containerElement, 'Display');

		new Setting(containerElement)
			.setName('Line numbers')
			.setDesc('Override: RENDER.LINES: true')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showLineNumbers)
				.onChange(async (value) => {
					this.plugin.settings.showLineNumbers = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerElement)
			.setName('Zebra stripes')
			.setDesc('Override: RENDER.ZEBRA: true')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showZebraStripes)
				.onChange(async (value) => {
					this.plugin.settings.showZebraStripes = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerElement)
			.setName('Copy button')
			.setDesc('Override: RENDER.COPY: true')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showCopyButton)
				.onChange(async (value) => {
					this.plugin.settings.showCopyButton = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerElement)
			.setName('Download button')
			.setDesc('Show a button to save code block content to a file')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showDownloadButton)
				.onChange(async (value) => {
					this.plugin.settings.showDownloadButton = value;
					await this.plugin.saveSettings();
				}));

		this.createSectionDivider(containerElement);

		// Folding section
		this.createSectionHeader(containerElement, 'Folding');

		new Setting(containerElement)
			.setName('Default fold lines')
			.setDesc('0 = disabled, 1+ = fold to N lines. Override: RENDER.FOLD: 10')
			.addText(textInput => textInput
				.setPlaceholder('0')
				.setValue(String(this.plugin.settings.foldLines))
				.onChange(async (value) => {
					const parsedValue = parseInt(value, 10);
					if (!isNaN(parsedValue) && parsedValue >= 0) {
						this.plugin.settings.foldLines = parsedValue;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerElement)
			.setName('Default scroll lines')
			.setDesc('0 = disabled, 1+ = scroll after N lines. Override: RENDER.SCROLL: 20. Ignored if FOLD is active.')
			.addText(textInput => textInput
				.setPlaceholder('0')
				.setValue(String(this.plugin.settings.scrollLines))
				.onChange(async (value) => {
					const parsedValue = parseInt(value, 10);
					if (!isNaN(parsedValue) && parsedValue >= 0) {
						this.plugin.settings.scrollLines = parsedValue;
						await this.plugin.saveSettings();
					}
				}));

		this.createSectionDivider(containerElement);

		// Copy join section
		const altModLabel = (Platform.isMacOS || Platform.isIosApp) ? '⌘' : 'Alt';
		this.createSectionHeader(
			containerElement,
			'Copy Join',
			`Configure modifier+click copy behaviour per language. Shift+click and ${altModLabel}+click join lines with the specified operator. Ignore regex strips matching lines before joining.`
		);

		this.renderCopyJoinTable(containerElement, altModLabel);
	}

	// ===========================================================================
	// Copy Join Table
	// ===========================================================================

	/**
	 * Renders the Copy Join table with column headers and editable rows.
	 */
	private renderCopyJoinTable(containerElement: HTMLElement, altModLabel: string): void {
		const tableWrapper = containerElement.createEl('div', { cls: 'ucf-copyjoin-wrapper' });

		// Build table
		const table = tableWrapper.createEl('table', { cls: 'ucf-copyjoin-table' });

		// Header row
		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');
		headerRow.createEl('th', { text: 'Lang', cls: 'ucf-cj-col-lang' });
		headerRow.createEl('th', { text: '⇧ Click', cls: 'ucf-cj-col-op' });
		headerRow.createEl('th', { text: `${altModLabel} Click`, cls: 'ucf-cj-col-op' });
		headerRow.createEl('th', { text: 'Ignore', cls: 'ucf-cj-col-ignore' });
		headerRow.createEl('th', { text: '', cls: 'ucf-cj-col-action' });

		// Body rows
		const tbody = table.createEl('tbody');
		const configuredLangs = Object.keys(this.plugin.settings.languageCopyJoinDefaults).sort();

		for (const lang of configuredLangs) {
			const stored = this.plugin.settings.languageCopyJoinDefaults[lang];
			const row = tbody.createEl('tr');

			// Language name (read-only)
			row.createEl('td', { cls: 'ucf-cj-col-lang' }).createEl('code', { text: lang });

			// Shift join input
			const shiftCell = row.createEl('td', { cls: 'ucf-cj-col-op' });
			const shiftInput = shiftCell.createEl('input', {
				type: 'text',
				cls: 'ucf-cj-input ucf-cj-input-op',
				value: stored?.shiftJoin ?? '',
				attr: { placeholder: '&&' },
			});
			shiftInput.addEventListener('change', async () => {
				this.plugin.settings.languageCopyJoinDefaults[lang].shiftJoin = shiftInput.value;
				await this.plugin.saveSettings();
			});

			// Alt/Cmd join input
			const altCell = row.createEl('td', { cls: 'ucf-cj-col-op' });
			const altInput = altCell.createEl('input', {
				type: 'text',
				cls: 'ucf-cj-input ucf-cj-input-op',
				value: stored?.altJoin ?? '',
				attr: { placeholder: ';' },
			});
			altInput.addEventListener('change', async () => {
				this.plugin.settings.languageCopyJoinDefaults[lang].altJoin = altInput.value;
				await this.plugin.saveSettings();
			});

			// Ignore regex input
			const ignoreCell = row.createEl('td', { cls: 'ucf-cj-col-ignore' });
			const ignoreInput = ignoreCell.createEl('input', {
				type: 'text',
				cls: 'ucf-cj-input ucf-cj-input-ignore',
				value: stored?.joinIgnoreRegex ?? '',
				attr: { placeholder: '^\\s*#' },
			});
			ignoreInput.addEventListener('change', async () => {
				this.plugin.settings.languageCopyJoinDefaults[lang].joinIgnoreRegex = ignoreInput.value;
				await this.plugin.saveSettings();
			});

			// Remove button
			const actionCell = row.createEl('td', { cls: 'ucf-cj-col-action' });
			const removeBtn = actionCell.createEl('button', {
				text: '✕',
				cls: 'ucf-cj-remove',
				attr: { 'aria-label': `Remove ${lang}` },
			});
			removeBtn.addEventListener('click', async () => {
				delete this.plugin.settings.languageCopyJoinDefaults[lang];
				await this.plugin.saveSettings();
				this.display();
			});
		}

		// Add-language row
		const tfoot = table.createEl('tfoot');
		const addRow = tfoot.createEl('tr');
		const addCell = addRow.createEl('td', { cls: 'ucf-cj-col-lang' });
		const addInput = addCell.createEl('input', {
			type: 'text',
			cls: 'ucf-cj-input ucf-cj-input-lang',
			attr: { placeholder: 'e.g. bash' },
		});

		// Empty cells to fill the row
		addRow.createEl('td', { cls: 'ucf-cj-col-op' });
		addRow.createEl('td', { cls: 'ucf-cj-col-op' });
		addRow.createEl('td', { cls: 'ucf-cj-col-ignore' });

		const addActionCell = addRow.createEl('td', { cls: 'ucf-cj-col-action' });
		const addBtn = addActionCell.createEl('button', {
			text: '+',
			cls: 'ucf-cj-add',
			attr: { 'aria-label': 'Add language' },
		});
		addBtn.addEventListener('click', async () => {
			const newLang = addInput.value.trim().toLowerCase();
			if (newLang && !this.plugin.settings.languageCopyJoinDefaults[newLang]) {
				this.plugin.settings.languageCopyJoinDefaults[newLang] = {
					shiftJoin: '&&',
					altJoin: ';',
					joinIgnoreRegex: '^\\s*#',
				};
				await this.plugin.saveSettings();
				this.display();
			}
		});

		// Allow Enter key in the add input
		addInput.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				addBtn.click();
			}
		});
	}

	// ===========================================================================
	// Inline Tab
	// ===========================================================================

	private renderInlineTab(containerElement: HTMLElement): void {
		containerElement.createEl('p', {
			text: 'Configure inline code blocks (code written directly in the ufence block).',
			cls: CSS_CLASSES.tabIntro,
		});

		// Generic ufence section
		this.createSectionHeader(containerElement, 'Generic Embed');

		new Setting(containerElement)
			.setName('Enable ufence-code processor')
			.setDesc('Allows using ufence-code with RENDER.LANG property to specify language')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableGenericProcessor)
				.onChange(async (value) => {
					this.plugin.settings.enableGenericProcessor = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerElement)
			.setName('Default language')
			.setDesc('Language when RENDER.LANG is not specified in ufence-code blocks')
			.addText(textInput => textInput
				.setPlaceholder('text')
				.setValue(this.plugin.settings.defaultLanguage)
				.onChange(async (value) => {
					this.plugin.settings.defaultLanguage = value || 'text';
					await this.plugin.saveSettings();
				}));
	}

	// ===========================================================================
	// Command Output Tab
	// ===========================================================================

	private renderCommandOutputTab(containerElement: HTMLElement): void {
		containerElement.createEl('p', {
			text: 'Configure styling for command output blocks (ufence-cmdout).',
			cls: CSS_CLASSES.tabIntro,
		});

		// Prompt styling
		new Setting(containerElement)
			.setName('Prompt')
			.setDesc('Colour / Bold / Italic')
			.addColorPicker(picker => picker
				.setValue(this.plugin.settings.commandPromptColour || '#6b7280')
				.onChange(async (value) => {
					this.plugin.settings.commandPromptColour = value;
					await this.plugin.saveSettings();
				}))
			.addToggle(toggle => toggle
				.setTooltip('Bold')
				.setValue(this.plugin.settings.commandPromptBold)
				.onChange(async (value) => {
					this.plugin.settings.commandPromptBold = value;
					await this.plugin.saveSettings();
				}))
			.addToggle(toggle => toggle
				.setTooltip('Italic')
				.setValue(this.plugin.settings.commandPromptItalic)
				.onChange(async (value) => {
					this.plugin.settings.commandPromptItalic = value;
					await this.plugin.saveSettings();
				}));

		// Command styling
		new Setting(containerElement)
			.setName('Command')
			.setDesc('Colour / Bold / Italic')
			.addColorPicker(picker => picker
				.setValue(this.plugin.settings.commandTextColour || '#98c379')
				.onChange(async (value) => {
					this.plugin.settings.commandTextColour = value;
					await this.plugin.saveSettings();
				}))
			.addToggle(toggle => toggle
				.setTooltip('Bold')
				.setValue(this.plugin.settings.commandTextBold)
				.onChange(async (value) => {
					this.plugin.settings.commandTextBold = value;
					await this.plugin.saveSettings();
				}))
			.addToggle(toggle => toggle
				.setTooltip('Italic')
				.setValue(this.plugin.settings.commandTextItalic)
				.onChange(async (value) => {
					this.plugin.settings.commandTextItalic = value;
					await this.plugin.saveSettings();
				}));

		// Output styling
		new Setting(containerElement)
			.setName('Output')
			.setDesc('Colour / Bold / Italic')
			.addColorPicker(picker => picker
				.setValue(this.plugin.settings.outputTextColour || '#abb2bf')
				.onChange(async (value) => {
					this.plugin.settings.outputTextColour = value;
					await this.plugin.saveSettings();
				}))
			.addToggle(toggle => toggle
				.setTooltip('Bold')
				.setValue(this.plugin.settings.outputTextBold)
				.onChange(async (value) => {
					this.plugin.settings.outputTextBold = value;
					await this.plugin.saveSettings();
				}))
			.addToggle(toggle => toggle
				.setTooltip('Italic')
				.setValue(this.plugin.settings.outputTextItalic)
				.onChange(async (value) => {
					this.plugin.settings.outputTextItalic = value;
					await this.plugin.saveSettings();
				}));
	}

	// ===========================================================================
	// Appearance Tab
	// ===========================================================================

	private renderAppearanceTab(containerElement: HTMLElement): void {
		// Icons section
		this.createSectionHeader(containerElement, 'File Icons');

		new Setting(containerElement)
			.setName('Icon style')
			.addDropdown(dropdown => dropdown
				.addOption('emoji', 'Emoji (📜 🐍 🗃️)')
				.addOption('text', 'Text labels (SH, PY, SQL)')
				.addOption('filled', 'Filled boxes (coloured)')
				.addOption('outline', 'Outline boxes (theme-aware)')
				.addOption('custom', 'Custom (from folder)')
				.addOption('none', 'None')
				.setValue(this.plugin.settings.fileIconStyle)
				.onChange(async (value) => {
					this.plugin.settings.fileIconStyle = value as FileIconStyle;
					this.plugin.settings.showFileIcon = value !== 'none';
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.fileIconStyle === 'custom') {
			new Setting(containerElement)
				.setName('Icon folder')
				.setDesc('Folder with icon files (python.svg, bash.png, etc.)')
				.addText(textInput => textInput
					.setPlaceholder('Assets/Icons')
					.setValue(this.plugin.settings.customIconFolder)
					.onChange(async (value) => {
						this.plugin.settings.customIconFolder = value;
						await this.plugin.saveSettings();
					}));
		}

		new Setting(containerElement)
			.setName('Link indicator')
			.setDesc('Show ↗ on clickable titles')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showLinkIndicator)
				.onChange(async (value) => {
					this.plugin.settings.showLinkIndicator = value;
					await this.plugin.saveSettings();
				}));

		this.createSectionDivider(containerElement);

		// Colours section
		this.createSectionHeader(containerElement, 'Colours');

		new Setting(containerElement)
			.setName('Use theme colours')
			.setDesc('Automatically match Obsidian theme')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useThemeColours)
				.onChange(async (value) => {
					this.plugin.settings.useThemeColours = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (!this.plugin.settings.useThemeColours) {
			new Setting(containerElement)
				.setName('Background colour')
				.addColorPicker(picker => picker
					.setValue(this.plugin.settings.titleBarBackgroundColour || '#282c34')
					.onChange(async (value) => {
						this.plugin.settings.titleBarBackgroundColour = value;
						await this.plugin.saveSettings();
					}));

			new Setting(containerElement)
				.setName('Text colour')
				.addColorPicker(picker => picker
					.setValue(this.plugin.settings.titleBarTextColour || '#abb2bf')
					.onChange(async (value) => {
						this.plugin.settings.titleBarTextColour = value;
						await this.plugin.saveSettings();
					}));
		}
	}
}
