/**
 * Ultra Code Fence - Main Plugin Entry Point
 *
 * An Obsidian plugin for embedding code from files with enhanced display
 * features including titles, icons, line numbers, folding, and more.
 *
 * This file handles plugin lifecycle and coordinates the various modules.
 * All heavy lifting is delegated to specialised modules in the src folder.
 */

import { Component, Plugin, MarkdownRenderer, MarkdownPostProcessorContext, MarkdownView, parseYaml } from 'obsidian';

// Types
import type { PluginSettings, TitleBarStyle, SourceFileMetadata, ParsedYamlConfig } from './types';

// Constants
import { DEFAULT_SETTINGS, WHATS_NEW_DELAY_MS } from './constants';

// Parsers
import {
	parseBlockContent,
	parseNestedYamlConfig,
	resolveBlockConfig,
	resolveCmdoutConfig,
	applyFilterChain,
	resolveCalloutConfig,
} from './parsers';

// Services
import {
	loadSource,
	createEmbeddedCodeMetadata,
	isRemotePath,
	buildSuggestedFilename,
	downloadCodeToFile,
} from './services';

// Renderers
import {
	processCodeBlock,
	countSourceLines,
	wrapPreElement,
	addCodeBlockButtons,
	buildTitleContainer,
	renderCommandOutput,
	injectCallouts,
} from './renderers';

// UI
import { UltraCodeFenceSettingTab, WhatsNewModal } from './ui';

// Utils
import { replaceTemplateVariables, containsTemplateVariables, findPreElement, findCodeElement, resolvePreset } from './utils';

// What's New data
import releaseNotesData from './data/whatsnew.json';

// =============================================================================
// Plugin Class
// =============================================================================

/**
 * Main plugin class for Ultra Code Fence.
 *
 * Handles plugin lifecycle, settings management, and registration of
 * markdown processors for the various ufence block types.
 */
export default class UltraCodeFence extends Plugin {
	settings: PluginSettings;

	/** Page-level config defaults, keyed by note path */
	private pageConfigs = new Map<string, ParsedYamlConfig>();

	/**
	 * Called when the plugin is loaded.
	 *
	 * Initialises settings, registers processors, and shows
	 * the What's New modal if the version has changed.
	 */
	async onload(): Promise<void> {
		await this.loadSettings();

		// Register settings tab
		this.addSettingTab(new UltraCodeFenceSettingTab(this.app, this, releaseNotesData));

		// Show What's New modal on version update
		await this.checkVersionUpdate();

		// Register markdown post-processor for reading mode
		this.registerMarkdownPostProcessor((element, context) => {
			this.processReadingModeBlock(element, context);
		});

		// Register language-specific processors (ufence-{lang})
		this.registerLanguageProcessors();

		// Register generic ufence-code processor
		if (this.settings.enableGenericProcessor) {
			this.registerGenericProcessor();
		}

		// Register command output processor
		this.registerCommandOutputProcessor();

		// Register ufence-ufence config processor (invisible page-level defaults)
		this.registerConfigProcessor();
	}

	// ===========================================================================
	// Settings Management
	// ===========================================================================

	/**
	 * Loads settings from storage, merging with defaults.
	 */
	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Saves current settings to storage.
	 */
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	/**
	 * Checks if the plugin version has changed and shows What's New modal.
	 */
	private async checkVersionUpdate(): Promise<void> {
		const currentVersion = this.manifest.version;

		if (this.settings.lastSeenVersion !== currentVersion) {
			setTimeout(() => {
				new WhatsNewModal(this.app, currentVersion, releaseNotesData).open();
			}, WHATS_NEW_DELAY_MS);

			this.settings.lastSeenVersion = currentVersion;
			await this.saveSettings();
		}
	}

	// ===========================================================================
	// Processor Registration
	// ===========================================================================

	/**
	 * Registers processors for each configured language.
	 */
	private registerLanguageProcessors(): void {
		const languages = this.settings.supportedLanguages
			.split(',')
			.map(lang => lang.trim())
			.filter(lang => lang);

		for (const languageId of languages) {
			console.log(`Registering processor for ufence-${languageId}`);
			this.registerMarkdownCodeBlockProcessor(
				`ufence-${languageId}`,
				(content, element, context) => this.processUfenceBlock(content, element, context, languageId)
			);
		}
	}

	/**
	 * Registers the generic ufence-code processor.
	 */
	private registerGenericProcessor(): void {
		console.log('Registering generic ufence-code processor');
		this.registerMarkdownCodeBlockProcessor(
			'ufence-code',
			(content, element, context) => this.processUfenceBlock(content, element, context, this.settings.defaultLanguage)
		);
	}

	/**
	 * Registers the command output processor.
	 */
	private registerCommandOutputProcessor(): void {
		this.registerMarkdownCodeBlockProcessor(
			'ufence-cmdout',
			(content, element, context) => this.processCommandOutputBlock(content, element, context)
		);
	}

	/**
	 * Registers the ufence-ufence config processor.
	 *
	 * This invisible block allows page-level defaults to be set for all
	 * ufence blocks on the page. Supports both named preset references
	 * (PRESET: name) and inline YAML config (e.g. RENDER:\n  ZEBRA: true).
	 */
	private registerConfigProcessor(): void {
		this.registerMarkdownCodeBlockProcessor(
			'ufence-ufence',
			(content, element, _context) => {
				try {
					const raw = parseYaml(content);
					if (raw && typeof raw === 'object') {
						const record = raw as Record<string, unknown>;

						// Handle top-level PRESET: shorthand → move to META.PRESET
						if (record['PRESET'] !== undefined) {
							if (!record['META'] || typeof record['META'] !== 'object') {
								record['META'] = {};
							}
							(record['META'] as Record<string, unknown>)['PRESET'] = record['PRESET'];
							delete record['PRESET'];
						}

						const config = parseNestedYamlConfig(record);
						this.setPageConfig(_context.sourcePath, config);
					}
				} catch {
					// Silently ignore parse errors in config blocks
				}

				// Make the block invisible
				element.style.display = 'none';
			}
		);
	}

	// ===========================================================================
	// Page-Level Config Helpers
	// ===========================================================================

	/**
	 * Sets the page-level config defaults for a given note path.
	 */
	private setPageConfig(notePath: string, config: ParsedYamlConfig): void {
		this.pageConfigs.set(notePath, config);
	}

	/**
	 * Gets the page-level config defaults for a given note path.
	 */
	private getPageConfig(notePath: string): ParsedYamlConfig | undefined {
		return this.pageConfigs.get(notePath);
	}

	// ===========================================================================
	// Block Processing
	// ===========================================================================

	/**
	 * Processes a ufence code block.
	 *
	 * Handles both file references (META.PATH) and inline code
	 * (~~~ separator). Uses the nested YAML configuration structure.
	 *
	 * @param rawContent - Raw block content
	 * @param containerElement - Container element to render into
	 * @param processorContext - Markdown processor context
	 * @param defaultLanguage - Default language for syntax highlighting
	 */
	private async processUfenceBlock(
		rawContent: string,
		containerElement: HTMLElement,
		processorContext: MarkdownPostProcessorContext,
		defaultLanguage: string
	): Promise<void> {
		// Parse block content
		let parsedBlock;
		try {
			parsedBlock = parseBlockContent(rawContent);
		} catch {
			await this.renderErrorMessage(containerElement, 'invalid embedding (invalid YAML)');
			return;
		}

		// Parse nested YAML configuration and resolve with defaults
		const yamlConfig = parseNestedYamlConfig(parsedBlock.yamlProperties);

		// Apply preset and/or page-level defaults (if any)
		const mergedConfig = resolvePreset(
			yamlConfig,
			this.settings.presets,
			this.getPageConfig(processorContext.sourcePath)
		);

		const config = resolveBlockConfig(mergedConfig, this.settings, defaultLanguage);

		let sourceCode = '';
		let fileMetadata: SourceFileMetadata;

		// Determine source
		if (parsedBlock.hasEmbeddedCode) {
			sourceCode = parsedBlock.embeddedCode || '';
			fileMetadata = createEmbeddedCodeMetadata(config.titleTemplate, config.language);
		} else {
			if (!config.sourcePath) {
				await this.renderErrorMessage(containerElement, 'invalid source - use META.PATH or ~~~ separator for inline code');
				return;
			}

			const loadResult = await loadSource(this.app, config.sourcePath);

			if (!loadResult.succeeded) {
				await this.renderErrorMessage(containerElement, loadResult.errorMessage || 'failed to load source');
				return;
			}

			sourceCode = loadResult.sourceCode;
			fileMetadata = loadResult.fileMetadata!;
		}

		// Apply filter chain (BY_LINES first, then BY_MARKS)
		const filterResult = applyFilterChain(sourceCode, config);

		if (filterResult.error) {
			await this.renderErrorMessage(containerElement, filterResult.error);
			return;
		}

		sourceCode = filterResult.content;

		// Resolve display options
		const shouldHideTitle = config.titleTemplate === '' || config.titleTemplate.toLowerCase() === 'none' || config.titleBarStyle === 'none';

		let displayTitle = config.titleTemplate;

		if (displayTitle && containsTemplateVariables(displayTitle)) {
			displayTitle = replaceTemplateVariables(displayTitle, fileMetadata);
		}

		// FOLD takes precedence over SCROLL
		const enableCodeFolding = config.foldLines > 0;
		const enableScrolling = !enableCodeFolding && config.scrollLines > 0;

		const totalLineCount = countSourceLines(sourceCode);

		// Render the code block (use a short-lived component instead of the plugin
		// instance to avoid memory leaks from the long-lived plugin lifecycle)
		const renderComponent = new Component();
		renderComponent.load();
		await MarkdownRenderer.render(
			this.app,
			'```' + config.language + '\n' + sourceCode + '\n```',
			containerElement,
			'',
			renderComponent
		);

		// Process code block (line numbers, zebra, scrolling)
		processCodeBlock(containerElement, {
			showLineNumbers: config.showLineNumbers,
			showZebraStripes: config.showZebraStripes,
			startingLineNumber: 1,
			scrollLines: enableScrolling ? config.scrollLines : 0,
		});

		// Resolve and inject callouts (must happen after processCodeBlock
		// creates the ucf-line DOM structure that callouts attach to)
		const calloutConfig = resolveCalloutConfig(mergedConfig.CALLOUT, sourceCode, totalLineCount);
		if (calloutConfig.enabled) {
			const codeEl = findCodeElement(containerElement);
			const preEl = findPreElement(containerElement);
			if (codeEl && preEl) {
				injectCallouts(codeEl, preEl, containerElement, calloutConfig);
			}
		}

		// Set print behaviour attribute on <pre> for @media print CSS
		const preElementForPrint = findPreElement(containerElement);
		if (preElementForPrint) {
			preElementForPrint.dataset.ucfPrint = config.printBehaviour;
		}

		// Build download callback — prefer source filename over display title
		const downloadName = fileMetadata?.filename || displayTitle || '';
		const suggestedFilename = buildSuggestedFilename(downloadName, config.language);
		const notePath = processorContext.sourcePath;
		const onDownload = this.settings.showDownloadButton
			? async (codeText: string) => {
				await downloadCodeToFile(codeText, suggestedFilename, notePath, this.settings, () => this.saveSettings());
			}
			: undefined;

		// Add title or just buttons
		if (!shouldHideTitle && displayTitle) {
			const clickablePath = parsedBlock.hasEmbeddedCode
				? undefined
				: (isRemotePath(config.sourcePath!)
					? config.sourcePath!
					: config.sourcePath!.replace(/^vault:\/\//, ''));

			await this.attachTitleBarToCodeBlock(
				containerElement,
				displayTitle,
				clickablePath,
				config.titleBarStyle,
				fileMetadata,
				config.language,
				config.descriptionText,
				processorContext.sourcePath,
				config.showCopyButton,
				totalLineCount,
				config.foldLines,
				config.shiftCopyJoin,
				config.altCopyJoin,
				config.joinIgnoreRegex,
				this.settings.showDownloadButton,
				onDownload
			);
		} else {
			const preElement = findPreElement(containerElement);
			if (preElement) {
				addCodeBlockButtons(preElement, {
					showCopyButton: config.showCopyButton,
					showDownloadButton: this.settings.showDownloadButton,
					totalLineCount,
					foldLines: config.foldLines,
					shiftCopyJoin: config.shiftCopyJoin,
					altCopyJoin: config.altCopyJoin,
					joinIgnoreRegex: config.joinIgnoreRegex,
					onDownload,
				});
			}
		}
	}

	/**
	 * Processes a command output block.
	 *
	 * Uses the nested YAML configuration structure with META, DISPLAY, and STYLE sections.
	 *
	 * @param rawContent - Raw block content
	 * @param containerElement - Container element
	 * @param processorContext - Processor context
	 */
	private async processCommandOutputBlock(
		rawContent: string,
		containerElement: HTMLElement,
		processorContext: MarkdownPostProcessorContext
	): Promise<void> {
		let outputCode = '';
		let config;

		// Parse content
		try {
			const parsedBlock = parseBlockContent(rawContent);
			outputCode = parsedBlock.hasEmbeddedCode ? (parsedBlock.embeddedCode || '') : rawContent;

			// Parse nested YAML configuration and resolve with defaults
			const yamlConfig = parseNestedYamlConfig(parsedBlock.yamlProperties);
			config = resolveCmdoutConfig(yamlConfig, this.settings);
		} catch {
			// Fallback: treat entire content as output with default config
			outputCode = rawContent;
			config = resolveCmdoutConfig({}, this.settings);
		}

		// Validate prompt pattern if specified
		if (config.promptPattern === undefined && config.styles.promptColour) {
			// Prompt color was specified but pattern is invalid - this shouldn't happen
			// as resolveCmdoutConfig handles this, but check just in case
		}

		// Render
		const renderedContainer = await renderCommandOutput(this.app, outputCode, {
			titleText: config.titleText,
			descriptionText: config.descriptionText,
			promptPattern: config.promptPattern,
			styles: config.styles,
			showCopyButton: config.showCopyButton,
			scrollLines: config.scrollLines,
			containingNotePath: processorContext.sourcePath,
		}, this);

		containerElement.appendChild(renderedContainer);

		// Set print behaviour attribute on <pre> for @media print CSS
		const cmdoutPre = renderedContainer.querySelector('pre');
		if (cmdoutPre) {
			cmdoutPre.dataset.ucfPrint = config.printBehaviour;
		}
	}

	/**
	 * Processes a code block in reading mode (standard markdown code blocks).
	 *
	 * Looks for TITLE and STYLE properties in the code fence line.
	 *
	 * @param element - Container element
	 * @param processorContext - Processor context
	 */
	private async processReadingModeBlock(
		element: HTMLElement,
		processorContext: MarkdownPostProcessorContext
	): Promise<void> {
		const codeElement = element.querySelector('pre > code');
		if (!codeElement) return;

		const preElement = codeElement.parentElement as HTMLPreElement;
		const sectionInfo = processorContext.getSectionInfo(preElement);
		if (!sectionInfo) return;

		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!markdownView) return;

		const firstLine = markdownView.editor.getLine(sectionInfo.lineStart);

		// Extract title from code fence
		const titleMatch = firstLine.match(/TITLE:\s*"([^"]*)"/i);
		if (!titleMatch) return;

		const extractedTitle = titleMatch[1];
		if (!extractedTitle) return;

		// Extract style
		let titleBarStyle = this.settings.defaultTitleBarStyle;
		const styleMatch = firstLine.match(/STYLE:\s*"([^"]*)"/i);
		if (styleMatch) {
			titleBarStyle = styleMatch[1].toLowerCase() as TitleBarStyle;
		}

		// Extract description
		let descriptionText: string | undefined;
		const descMatch = firstLine.match(/(?:DESCRIPTION|DESC):\s*"([^"]*)"/i);
		if (descMatch) {
			descriptionText = descMatch[1];
		}

		await this.attachTitleBarToCodeBlock(
			element,
			extractedTitle,
			undefined,
			titleBarStyle,
			undefined,
			undefined,
			descriptionText,
			processorContext.sourcePath,
			this.settings.showCopyButton,
			0,  // totalLineCount - not tracked for reading mode
			this.settings.foldLines
		);
	}

	// ===========================================================================
	// Helper Methods
	// ===========================================================================

	/**
	 * Adds a title container to a code block.
	 */
	private async attachTitleBarToCodeBlock(
		containerElement: HTMLElement,
		titleText: string,
		clickablePath: string | undefined,
		titleBarStyle: TitleBarStyle,
		fileMetadata: SourceFileMetadata | undefined,
		language: string | undefined,
		descriptionText: string | undefined,
		containingNotePath: string,
		showCopyButton: boolean,
		totalLineCount: number,
		foldLines: number,
		shiftCopyJoin?: string,
		altCopyJoin?: string,
		joinIgnoreRegex?: string,
		showDownloadButton?: boolean,
		onDownload?: (codeText: string) => Promise<void>
	): Promise<void> {
		const preElement = findPreElement(containerElement);
		if (!preElement) return;

		const titleContainer = await buildTitleContainer(this.app, this.settings, {
			titleText,
			clickablePath,
			titleBarStyle,
			fileMetadata,
			language,
			descriptionText,
			containingNotePath,
			hideTitle: false,
			useThemeColours: this.settings.useThemeColours,
			backgroundColour: this.settings.titleBarBackgroundColour,
			textColour: this.settings.titleBarTextColour,
			descriptionDisplayMode: this.settings.descriptionDisplayMode,
			descriptionColour: this.settings.descriptionColour,
			descriptionItalic: this.settings.descriptionItalic,
		}, this);

		wrapPreElement(preElement, titleContainer);

		addCodeBlockButtons(preElement, {
			showCopyButton,
			showDownloadButton: showDownloadButton ?? false,
			totalLineCount,
			foldLines,
			shiftCopyJoin,
			altCopyJoin,
			joinIgnoreRegex,
			onDownload,
		});
	}

	/**
	 * Renders an error message.
	 */
	private async renderErrorMessage(containerElement: HTMLElement, errorText: string): Promise<void> {
		const errorComponent = new Component();
		errorComponent.load();
		await MarkdownRenderer.render(
			this.app,
			`\`ERROR: ${errorText}\``,
			containerElement,
			'',
			errorComponent
		);
	}
}
