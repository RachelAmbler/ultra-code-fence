/**
 * Ultra Code Fence - Settings Tab
 *
 * Provides the configuration UI for the plugin. Organised into tabs
 * for different setting categories: General, Title, Code, Inline,
 * Command Output, and Appearance.
 */

import { App, Platform, Plugin, PluginSettingTab, Setting } from 'obsidian';
import type { PluginSettings, TitleBarStyle, FileIconStyle, DescriptionDisplayMode, ReleaseNotesData } from '../types';
import { CSS_CLASSES } from '../constants';
import { WhatsNewModal } from './whats-new-modal';
import { createYamlEditor } from './yaml-editor';

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
	private activeTabId = 'general';

	/**
	 * Creates a new settings tab.
	 *
	 * @param app - Obsidian App instance
	 * @param plugin - Plugin instance
	 * @param releaseNotesData - Release notes data for the modal
	 */
	constructor(app: App, plugin: SettingsPlugin, releaseNotesData: ReleaseNotesData) {
		super(app, plugin as unknown as Plugin);
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

		// Tab navigation
		const tabContainer = containerEl.createEl('div', { cls: CSS_CLASSES.tabs });
		const tabContentContainer = containerEl.createEl('div', { cls: CSS_CLASSES.tabContent });

		const tabDefinitions: SettingsTabDefinition[] = [
			{ tabId: 'general', tabLabel: 'General' },
			{ tabId: 'title', tabLabel: 'Title' },
			{ tabId: 'code', tabLabel: 'Code' },
			{ tabId: 'inline', tabLabel: 'Inline' },
			{ tabId: 'cmdout', tabLabel: 'Cmd output' },
			{ tabId: 'appearance', tabLabel: 'Appearance' },
			{ tabId: 'presets', tabLabel: 'Presets' },
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
				case 'presets':
					this.renderPresetsTab(tabContentContainer);
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
		const heading = new Setting(containerElement).setName(headerText).setHeading();
		heading.settingEl.addClass(CSS_CLASSES.sectionHeader);

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
				.setPlaceholder('Python, javascript, bash, ...')
				.setValue(this.plugin.settings.supportedLanguages)
				.onChange((value) => {
					this.plugin.settings.supportedLanguages = value;
					void this.plugin.saveSettings();
				}));

		this.createSectionDivider(containerElement);

		// Path section
		this.createSectionHeader(containerElement, 'File paths');

		new Setting(containerElement)
			.setName('Default path prefix')
			.setDesc('Prepended to file paths that do not start with a vault or web address')
			.addText(textInput => textInput
				.setPlaceholder('Folder/subfolder/')
				.setValue(this.plugin.settings.defaultPathPrefix)
				.onChange((value) => {
					this.plugin.settings.defaultPathPrefix = value;
					void this.plugin.saveSettings();
				}));

		this.createSectionDivider(containerElement);

		// Help section
		this.createSectionHeader(containerElement, 'Template variables', 'Use these in the title template:');

		const helpGrid = containerElement.createEl('div', { cls: 'ucf-help-grid' });
		const groups = [
			{ label: 'File info', codes: ['{filename}', '{basename}', '{extension}', '{parentfolder}'] },
			{ label: 'Size', codes: ['{size}', '{size:kb}', '{size:mb}'] },
			{ label: 'Dates', codes: ['{modified:relative}', '{modified:short}', '{modified:iso}'] },
			{ label: 'Formatting', codes: ['{filename:upper}', '{filename:lower}', '{filename:title}'] },
		];

		for (const group of groups) {
			const groupDiv = helpGrid.createEl('div', { cls: 'ucf-help-group' });
			groupDiv.createEl('div', { text: group.label, cls: 'ucf-help-label' });
			for (const code of group.codes) {
				groupDiv.createEl('code', { text: code });
				groupDiv.appendChild(document.createTextNode(' '));
			}
		}
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
		this.createSectionHeader(containerElement, 'Title bar');

		new Setting(containerElement)
			.setName('Style')
			.setDesc('Choose the visual style for the title bar above code blocks')
			.addDropdown(dropdown => dropdown
				.addOption('tab', 'Tab')
				.addOption('integrated', 'Integrated')
				.addOption('minimal', 'Minimal')
				.addOption('infobar', 'Info bar')
				.addOption('none', 'Hidden')
				.setValue(this.plugin.settings.defaultTitleBarStyle)
				.onChange((value) => {
					this.plugin.settings.defaultTitleBarStyle = value as TitleBarStyle;
					void this.plugin.saveSettings();
				}));

		new Setting(containerElement)
			.setName('Title template')
			.setDesc('Template for the title text. Supports variables like {filename}')
			.addText(textInput => textInput
				.setPlaceholder('{filename}')
				.setValue(this.plugin.settings.defaultTitleTemplate)
				.onChange((value) => {
					this.plugin.settings.defaultTitleTemplate = value;
					void this.plugin.saveSettings();
				}));

		this.createSectionDivider(containerElement);

		// Description section
		this.createSectionHeader(containerElement, 'Description');

		new Setting(containerElement)
			.setName('Display mode')
			.setDesc('Choose how the description text is displayed')
			.addDropdown(dropdown => dropdown
				.addOption('below', 'Below title')
				.addOption('tooltip', 'Tooltip on hover')
				.addOption('none', 'Hidden')
				.setValue(this.plugin.settings.descriptionDisplayMode)
				.onChange((value) => {
					this.plugin.settings.descriptionDisplayMode = value as DescriptionDisplayMode;
					void this.plugin.saveSettings().then(() => { this.display(); }); // Refresh to show/hide related settings
				}));

		if (this.plugin.settings.descriptionDisplayMode !== 'none') {
			new Setting(containerElement)
				.setName('Italic')
				.setDesc('Display description text in italics')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.descriptionItalic)
					.onChange((value) => {
						this.plugin.settings.descriptionItalic = value;
						void this.plugin.saveSettings();
					}));

			new Setting(containerElement)
				.setName('Colour')
				.setDesc('Custom colour for description text')
				.addColorPicker(picker => picker
					.setValue(this.plugin.settings.descriptionColour || '#888888')
					.onChange((value) => {
						this.plugin.settings.descriptionColour = value;
						void this.plugin.saveSettings();
					}))
				.addToggle(toggle => toggle
					.setTooltip('Use custom colour')
					.setValue(!!this.plugin.settings.descriptionColour)
					.onChange((value) => {
						this.plugin.settings.descriptionColour = value ? '#888888' : '';
						void this.plugin.saveSettings().then(() => { this.display(); });
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
			.setDesc('Show line numbers alongside code')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showLineNumbers)
				.onChange((value) => {
					this.plugin.settings.showLineNumbers = value;
					void this.plugin.saveSettings();
				}));

		new Setting(containerElement)
			.setName('Zebra stripes')
			.setDesc('Alternate row background colours for readability')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showZebraStripes)
				.onChange((value) => {
					this.plugin.settings.showZebraStripes = value;
					void this.plugin.saveSettings();
				}));

		new Setting(containerElement)
			.setName('Copy button')
			.setDesc('Show a button to copy the code block content')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showCopyButton)
				.onChange((value) => {
					this.plugin.settings.showCopyButton = value;
					void this.plugin.saveSettings();
				}));

		new Setting(containerElement)
			.setName('Download button')
			.setDesc('Show a button to save code block content to a file')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showDownloadButton)
				.onChange((value) => {
					this.plugin.settings.showDownloadButton = value;
					void this.plugin.saveSettings();
				}));

		this.createSectionDivider(containerElement);

		// Folding section
		this.createSectionHeader(containerElement, 'Folding');

		new Setting(containerElement)
			.setName('Default fold lines')
			.setDesc('Collapse long code blocks after this many lines (0 to disable)')
			.addText(textInput => textInput
				.setPlaceholder('0')
				.setValue(String(this.plugin.settings.foldLines))
				.onChange((value) => {
					const parsedValue = parseInt(value, 10);
					if (!isNaN(parsedValue) && parsedValue >= 0) {
						this.plugin.settings.foldLines = parsedValue;
						void this.plugin.saveSettings();
					}
				}));

		new Setting(containerElement)
			.setName('Default scroll lines')
			.setDesc('Add a scrollbar after this many lines (0 to disable). Ignored when fold is active.')
			.addText(textInput => textInput
				.setPlaceholder('0')
				.setValue(String(this.plugin.settings.scrollLines))
				.onChange((value) => {
					const parsedValue = parseInt(value, 10);
					if (!isNaN(parsedValue) && parsedValue >= 0) {
						this.plugin.settings.scrollLines = parsedValue;
						void this.plugin.saveSettings();
					}
				}));

		new Setting(containerElement)
			.setName('Print behaviour')
			.setDesc('How folded or scrolled code blocks behave when printing')
			.addDropdown(dropdown => dropdown
				.addOption('expand', 'Expand (show full code)')
				.addOption('asis', 'As displayed')
				.setValue(this.plugin.settings.printBehaviour)
				.onChange((value) => {
					this.plugin.settings.printBehaviour = value;
					void this.plugin.saveSettings();
				}));

		this.createSectionDivider(containerElement);

		// Copy join section
		const altModLabel = (Platform.isMacOS || Platform.isIosApp) ? '⌘' : 'Alt';
		this.createSectionHeader(
			containerElement,
			'Copy join',
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
		headerRow.createEl('th', { text: '⇧ click', cls: 'ucf-cj-col-op' });
		headerRow.createEl('th', { text: `${altModLabel} click`, cls: 'ucf-cj-col-op' });
		headerRow.createEl('th', { text: 'Ignore', cls: 'ucf-cj-col-ignore' });
		headerRow.createEl('th', { text: '', cls: 'ucf-cj-col-action' });

		// Body rows
		const tbody = table.createEl('tbody');
		const configuredLangs = Object.keys(this.plugin.settings.languageCopyJoinDefaults).sort();

		for (const lang of configuredLangs) {
			const stored = this.plugin.settings.languageCopyJoinDefaults[lang];
			if (!stored) continue;
			const row = tbody.createEl('tr');

			// Language name (read-only)
			row.createEl('td', { cls: 'ucf-cj-col-lang' }).createEl('code', { text: lang });

			// Shift join input
			const shiftCell = row.createEl('td', { cls: 'ucf-cj-col-op' });
			const shiftInput = shiftCell.createEl('input', {
				type: 'text',
				cls: 'ucf-cj-input ucf-cj-input-op',
				value: stored.shiftJoin,
				attr: { placeholder: '&&' },
			});
			shiftInput.addEventListener('change', () => {
				const entry = this.plugin.settings.languageCopyJoinDefaults[lang];
				if (entry) entry.shiftJoin = shiftInput.value;
				void this.plugin.saveSettings();
			});

			// Alt/Cmd join input
			const altCell = row.createEl('td', { cls: 'ucf-cj-col-op' });
			const altInput = altCell.createEl('input', {
				type: 'text',
				cls: 'ucf-cj-input ucf-cj-input-op',
				value: stored.altJoin,
				attr: { placeholder: ';' },
			});
			altInput.addEventListener('change', () => {
				const entry = this.plugin.settings.languageCopyJoinDefaults[lang];
				if (entry) entry.altJoin = altInput.value;
				void this.plugin.saveSettings();
			});

			// Ignore regex input
			const ignoreCell = row.createEl('td', { cls: 'ucf-cj-col-ignore' });
			const ignoreInput = ignoreCell.createEl('input', {
				type: 'text',
				cls: 'ucf-cj-input ucf-cj-input-ignore',
				value: stored.joinIgnoreRegex,
				attr: { placeholder: '^\\s*#' },
			});
			ignoreInput.addEventListener('change', () => {
				const entry = this.plugin.settings.languageCopyJoinDefaults[lang];
				if (entry) entry.joinIgnoreRegex = ignoreInput.value;
				void this.plugin.saveSettings();
			});

			// Remove button
			const actionCell = row.createEl('td', { cls: 'ucf-cj-col-action' });
			const removeBtn = actionCell.createEl('button', {
				text: '✕',
				cls: 'ucf-cj-remove',
				attr: { 'aria-label': `Remove ${lang}` },
			});
			removeBtn.addEventListener('click', () => {
				this.plugin.settings.languageCopyJoinDefaults = Object.fromEntries(
					Object.entries(this.plugin.settings.languageCopyJoinDefaults).filter(([k]) => k !== lang),
				);
				void this.plugin.saveSettings().then(() => { this.display(); });
			});
		}

		// Add-language row
		const tfoot = table.createEl('tfoot');
		const addRow = tfoot.createEl('tr');
		const addCell = addRow.createEl('td', { cls: 'ucf-cj-col-lang' });
		const addInput = addCell.createEl('input', {
			type: 'text',
			cls: 'ucf-cj-input ucf-cj-input-lang',
			attr: { placeholder: 'Language name' },
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
		addBtn.addEventListener('click', () => {
			const newLang = addInput.value.trim().toLowerCase();
			if (newLang && !(newLang in this.plugin.settings.languageCopyJoinDefaults)) {
				this.plugin.settings.languageCopyJoinDefaults[newLang] = {
					shiftJoin: '&&',
					altJoin: ';',
					joinIgnoreRegex: '^\\s*#',
				};
				void this.plugin.saveSettings().then(() => { this.display(); });
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
		this.createSectionHeader(containerElement, 'Generic embed');

		new Setting(containerElement)
			.setName('Enable ufence-code processor')
			.setDesc('Enable the ufence-code block type for language-agnostic embeds')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableGenericProcessor)
				.onChange((value) => {
					this.plugin.settings.enableGenericProcessor = value;
					void this.plugin.saveSettings();
				}));

		new Setting(containerElement)
			.setName('Default language')
			.setDesc('Fallback language for ufence-code blocks without a language override')
			.addText(textInput => textInput
				.setPlaceholder('Text')
				.setValue(this.plugin.settings.defaultLanguage)
				.onChange((value) => {
					this.plugin.settings.defaultLanguage = value || 'text';
					void this.plugin.saveSettings();
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
			.setDesc('Style the text appearance with colour, bold, and italic')
			.addColorPicker(picker => picker
				.setValue(this.plugin.settings.commandPromptColour || '#6b7280')
				.onChange((value) => {
					this.plugin.settings.commandPromptColour = value;
					void this.plugin.saveSettings();
				}))
			.addToggle(toggle => toggle
				.setTooltip('Bold')
				.setValue(this.plugin.settings.commandPromptBold)
				.onChange((value) => {
					this.plugin.settings.commandPromptBold = value;
					void this.plugin.saveSettings();
				}))
			.addToggle(toggle => toggle
				.setTooltip('Italic')
				.setValue(this.plugin.settings.commandPromptItalic)
				.onChange((value) => {
					this.plugin.settings.commandPromptItalic = value;
					void this.plugin.saveSettings();
				}));

		// Command styling
		new Setting(containerElement)
			.setName('Command')
			.setDesc('Style the text appearance with colour, bold, and italic')
			.addColorPicker(picker => picker
				.setValue(this.plugin.settings.commandTextColour || '#98c379')
				.onChange((value) => {
					this.plugin.settings.commandTextColour = value;
					void this.plugin.saveSettings();
				}))
			.addToggle(toggle => toggle
				.setTooltip('Bold')
				.setValue(this.plugin.settings.commandTextBold)
				.onChange((value) => {
					this.plugin.settings.commandTextBold = value;
					void this.plugin.saveSettings();
				}))
			.addToggle(toggle => toggle
				.setTooltip('Italic')
				.setValue(this.plugin.settings.commandTextItalic)
				.onChange((value) => {
					this.plugin.settings.commandTextItalic = value;
					void this.plugin.saveSettings();
				}));

		// Output styling
		new Setting(containerElement)
			.setName('Output')
			.setDesc('Style the text appearance with colour, bold, and italic')
			.addColorPicker(picker => picker
				.setValue(this.plugin.settings.outputTextColour || '#abb2bf')
				.onChange((value) => {
					this.plugin.settings.outputTextColour = value;
					void this.plugin.saveSettings();
				}))
			.addToggle(toggle => toggle
				.setTooltip('Bold')
				.setValue(this.plugin.settings.outputTextBold)
				.onChange((value) => {
					this.plugin.settings.outputTextBold = value;
					void this.plugin.saveSettings();
				}))
			.addToggle(toggle => toggle
				.setTooltip('Italic')
				.setValue(this.plugin.settings.outputTextItalic)
				.onChange((value) => {
					this.plugin.settings.outputTextItalic = value;
					void this.plugin.saveSettings();
				}));
	}

	// ===========================================================================
	// Appearance Tab
	// ===========================================================================

	private renderAppearanceTab(containerElement: HTMLElement): void {
		// Icons section
		this.createSectionHeader(containerElement, 'File icons');

		new Setting(containerElement)
			.setName('Icon style')
			.addDropdown(dropdown => dropdown
				.addOption('emoji', 'Emoji (📜 🐍 🗃️)')
				.addOption('text', 'Text labels (sh, py, SQL)')
				.addOption('filled', 'Filled boxes (coloured)')
				.addOption('outline', 'Outline boxes (theme-aware)')
				.addOption('custom', 'Custom (from folder)')
				.addOption('none', 'None')
				.setValue(this.plugin.settings.fileIconStyle)
				.onChange((value) => {
					this.plugin.settings.fileIconStyle = value as FileIconStyle;
					this.plugin.settings.showFileIcon = value !== 'none';
					void this.plugin.saveSettings().then(() => { this.display(); });
				}));

		if (this.plugin.settings.fileIconStyle === 'custom') {
			new Setting(containerElement)
				.setName('Icon folder')
				.setDesc('Folder with icon files (python.svg, bash.png, etc.)')
				.addText(textInput => textInput
				.setPlaceholder('Assets/icons')
					.setValue(this.plugin.settings.customIconFolder)
					.onChange((value) => {
						this.plugin.settings.customIconFolder = value;
						void this.plugin.saveSettings();
					}));
		}

		new Setting(containerElement)
			.setName('Link indicator')
			.setDesc('Show ↗ on clickable titles')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showLinkIndicator)
				.onChange((value) => {
					this.plugin.settings.showLinkIndicator = value;
					void this.plugin.saveSettings();
				}));

		this.createSectionDivider(containerElement);

		// Colours section
		this.createSectionHeader(containerElement, 'Colours');

		new Setting(containerElement)
			.setName('Use theme colours')
			.setDesc('Automatically match Obsidian theme')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useThemeColours)
				.onChange((value) => {
					this.plugin.settings.useThemeColours = value;
					void this.plugin.saveSettings().then(() => { this.display(); });
				}));

		if (!this.plugin.settings.useThemeColours) {
			new Setting(containerElement)
				.setName('Background colour')
				.addColorPicker(picker => picker
					.setValue(this.plugin.settings.titleBarBackgroundColour || '#282c34')
					.onChange((value) => {
						this.plugin.settings.titleBarBackgroundColour = value;
						void this.plugin.saveSettings();
					}));

			new Setting(containerElement)
				.setName('Text colour')
				.addColorPicker(picker => picker
					.setValue(this.plugin.settings.titleBarTextColour || '#abb2bf')
					.onChange((value) => {
						this.plugin.settings.titleBarTextColour = value;
						void this.plugin.saveSettings();
					}));
		}
	}

	// ===========================================================================
	// Presets Tab
	// ===========================================================================

	private renderPresetsTab(containerElement: HTMLElement): void {
		// Intro
		containerElement.createEl('p', {
			text: 'Create named presets to reuse across code blocks. Reference a preset by name in any code block, or set a page-level default.',
			cls: CSS_CLASSES.tabIntro,
		});

		this.createSectionDivider(containerElement);

		// Existing presets
		const presets = this.plugin.settings.presets;
		const names = Object.keys(presets).sort();

		if (names.length > 0) {
			this.createSectionHeader(containerElement, 'Saved presets');

			for (const name of names) {
				this.renderPresetEntry(containerElement, name, presets[name]);
			}

			this.createSectionDivider(containerElement);
		}

		// Add new preset
		this.createSectionHeader(containerElement, 'Add new preset');

		let newName = '';
		let newYaml = '';

		new Setting(containerElement)
			.setName('Name')
			.setDesc('A unique name for this preset')
			.addText(text => text
				.setPlaceholder('Preset name')
				.onChange(value => { newName = value.trim(); }));

		// YAML editor with syntax highlighting + validation
		const yamlContainer = containerElement.createEl('div');
		createYamlEditor(yamlContainer, {
			initialValue: '',
			placeholder: 'RENDER:\n  LINES: true\n  ZEBRA: true\n  FOLD: 20',
			onChange: (value) => { newYaml = value; },
		});

		new Setting(containerElement)
			.addButton(button => button
				.setButtonText('Add preset')
				.setCta()
				.onClick(() => {
					if (!newName) return;

					// Check for duplicate name
					if (this.plugin.settings.presets[newName]) {
						// Overwrite silently — user can see the name already exists above
					}

					this.plugin.settings.presets[newName] = newYaml;
					void this.plugin.saveSettings().then(() => { this.display(); });
				}));
	}

	/**
	 * Renders a single preset entry with an editable textarea and delete button.
	 */
	private renderPresetEntry(containerElement: HTMLElement, name: string, yamlContent: string): void {
		const wrapper = containerElement.createEl('div', { cls: 'ucf-preset-entry' });

		// Name heading — use Setting API as recommended by Obsidian lint
		new Setting(wrapper).setName(name).setHeading();

		// Editable YAML editor with syntax highlighting + validation
		const editorContainer = wrapper.createEl('div', { cls: 'ucf-preset-editor' });
		const editor = createYamlEditor(editorContainer, {
			initialValue: yamlContent,
			onChange: () => { /* live update — save on button click */ },
		});

		// Button row
		const buttonRow = wrapper.createEl('div', { cls: 'ucf-preset-buttons' });

		// Save button
		const saveBtn = buttonRow.createEl('button', { text: 'Save' });
		saveBtn.addEventListener('click', () => {
			this.plugin.settings.presets[name] = editor.getValue();
			void this.plugin.saveSettings();
			// Brief visual feedback
			saveBtn.textContent = 'Saved ✓';
			setTimeout(() => { saveBtn.textContent = 'Save'; }, 1500);
		});

		// Delete button
		const deleteBtn = buttonRow.createEl('button', { text: 'Delete', cls: 'ucf-preset-delete' });
		deleteBtn.addEventListener('click', () => {
			// Confirm deletion
			if (deleteBtn.dataset.confirming === 'true') {
				this.plugin.settings.presets = Object.fromEntries(
					Object.entries(this.plugin.settings.presets).filter(([k]) => k !== name),
				);
				void this.plugin.saveSettings().then(() => { this.display(); });
			} else {
				deleteBtn.dataset.confirming = 'true';
				deleteBtn.textContent = 'Click again to confirm';
				setTimeout(() => {
					deleteBtn.dataset.confirming = 'false';
					deleteBtn.textContent = 'Delete';
				}, 3000);
			}
		});
	}
}
