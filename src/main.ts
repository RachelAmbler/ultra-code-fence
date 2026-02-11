/**
 * Ultra Code Fence - Main Plugin Entry Point
 *
 * An Obsidian plugin for embedding code from files with enhanced display
 * features including titles, icons, line numbers, folding, and more.
 *
 * This file handles plugin lifecycle and coordinates the various modules.
 * All heavy lifting is delegated to specialised modules in the src folder.
 */

import { Component, Plugin, MarkdownRenderer, MarkdownPostProcessorContext, MarkdownView, TFile, parseYaml } from 'obsidian';

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
// Title Bar Attachment Config
// =============================================================================

/**
 * Configuration for attaching a title bar and buttons to a code block.
 *
 * Groups the parameters that were previously passed individually to
 * attachTitleBarToCodeBlock, making the call sites more readable.
 */
interface AttachTitleBarConfig {
	titleText: string;
	clickablePath?: string;
	titleBarStyle: TitleBarStyle;
	fileMetadata?: SourceFileMetadata;
	language?: string;
	descriptionText?: string;
	containingNotePath: string;
	showCopyButton: boolean;
	totalLineCount: number;
	foldLines: number;
	shiftCopyJoin?: string;
	altCopyJoin?: string;
	joinIgnoreRegex?: string;
	showDownloadButton?: boolean;
	onDownload?: (codeText: string) => void;
}

// =============================================================================
// Plugin Class
// =============================================================================

/**
 * Main plugin class for Ultra Code Fence.
 *
 * Handles plugin lifecycle, settings management, and registration of
 * markdown processors for the various ufence block types.
 */

/**
 * Normalises a raw YAML record from a ufence-ufence config block.
 *
 * Moves the top-level `PRESET` shorthand into `META.PRESET` so that
 * downstream resolution logic only needs to look in one place.
 */
function normaliseConfigRecord(record: Record<string, unknown>): void {
	if (record.PRESET !== undefined) {
		if (!record.META || typeof record.META !== 'object') {
			record.META = {};
		}
		(record.META as Record<string, unknown>).PRESET = record.PRESET;
		delete record.PRESET;
	}
}

export default class UltraCodeFence extends Plugin {
	settings: PluginSettings;

	/**
	 * Page-level config defaults, keyed by note path.
	 *
	 * Entries grow with the number of open notes and are pruned by the
	 * active-leaf-change handler when a note is closed.
	 */
	private pageConfigs = new Map<string, ParsedYamlConfig>();

	/**
	 * Rendered ufence blocks, keyed by note path — used to re-render
	 * on demand (Force Refresh command / settings save).
	 *
	 * Entries grow with the number of open notes and are pruned by the
	 * active-leaf-change handler when a note is closed. Within a single
	 * page, stale DOM entries are filtered by `isConnected` at refresh
	 * time so detached blocks never accumulate.
	 */
	private renderedBlocks = new Map<string, {
		container: HTMLElement;
		rawContent: string;
		context: MarkdownPostProcessorContext;
		defaultLanguage: string;
	}[]>();

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
		void this.processReadingModeBlock(element, context);
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

		// Command: Force refresh all ufence blocks on the current page
		this.addCommand({
			id: 'force-refresh',
			name: 'Force refresh all code blocks',
			callback: () => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view?.file) return;

				void this.refreshBlocksForPath(view.file.path);
			},
		});

		// Prune stale page config entries when navigating between notes
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				const openPaths = new Set<string>();
				this.app.workspace.iterateAllLeaves((leaf) => {
					if (leaf.view instanceof MarkdownView && leaf.view.file) {
						openPaths.add(leaf.view.file.path);
					}
				});

				for (const path of this.pageConfigs.keys()) {
					if (!openPaths.has(path)) {
						this.pageConfigs.delete(path);
					}
				}
				for (const path of this.renderedBlocks.keys()) {
					if (!openPaths.has(path)) {
						this.renderedBlocks.delete(path);
					}
				}
			})
		);
	}

	// ===========================================================================
	// Settings Management
	// ===========================================================================

	/**
	 * Loads settings from storage, merging with defaults.
	 *
	 * Missing keys are filled from {@link DEFAULT_SETTINGS} so that
	 * newly added settings always have a value after upgrade.
	 */
	async loadSettings(): Promise<void> {
		const stored = (await this.loadData()) as Partial<PluginSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, stored ?? {});
	}

	/**
	 * Persists the current {@link settings} object to disk and
	 * re-renders every tracked ufence block across all open notes
	 * so that changes (e.g. preset edits) take effect immediately.
	 */
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		await this.refreshAllBlocks();
	}

	/**
	 * Compares the running plugin version against the last-seen version
	 * stored in settings. If they differ, shows the What's New modal
	 * after a short delay ({@link WHATS_NEW_DELAY_MS}) and persists the
	 * new version so the modal isn't shown again.
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
	 * Registers a code block processor for every language in the
	 * comma-separated {@link PluginSettings.supportedLanguages} list.
	 *
	 * Each processor responds to <code>```ufence-{lang}</code> blocks
	 * and delegates to {@link processUfenceBlock} with the language id
	 * as the default highlighting language.
	 */
	private registerLanguageProcessors(): void {
		const languages = this.settings.supportedLanguages
			.split(',')
			.map(lang => lang.trim())
			.filter(lang => lang);

		for (const languageId of languages) {
			this.registerMarkdownCodeBlockProcessor(
				`ufence-${languageId}`,
				(content, element, context) => this.processUfenceBlock(content, element, context, languageId)
			);
		}
	}

	/**
	 * Registers the generic <code>```ufence-code</code> processor.
	 *
	 * Unlike the language-specific processors, this one uses the
	 * {@link PluginSettings.defaultLanguage} setting for highlighting.
	 * Gated behind {@link PluginSettings.enableGenericProcessor}.
	 */
	private registerGenericProcessor(): void {
		this.registerMarkdownCodeBlockProcessor(
			'ufence-code',
			(content, element, context) => this.processUfenceBlock(content, element, context, this.settings.defaultLanguage)
		);
	}

	/**
	 * Registers the <code>```ufence-cmdout</code> processor for
	 * terminal / command-output blocks. Delegates to
	 * {@link processCommandOutputBlock}.
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
					const raw: unknown = parseYaml(content);
					if (raw && typeof raw === 'object') {
						const record = raw as Record<string, unknown>;
						normaliseConfigRecord(record);

						const config = parseNestedYamlConfig(record);
						this.setPageConfig(_context.sourcePath, config);
					}
				} catch {
					// Silently ignore parse errors in config blocks
				}

				// Make the block invisible
				element.classList.add('ucf-config-block');
			}
		);
	}

	// ===========================================================================
	// Page-Level Config Helpers
	// ===========================================================================

	/**
	 * Sets the page-level config defaults for a given note path.
	 *
	 * Updates the in-memory cache only — does NOT trigger a re-render.
	 * Sibling ufence blocks pick up updated config when the user
	 * explicitly refreshes (Force Refresh command) or when the view
	 * is rebuilt naturally (e.g. navigating away and back).
	 *
	 * @param notePath - Vault-relative path of the note (e.g. `"Folder/Note.md"`).
	 * @param config   - Parsed YAML config from the ufence-ufence block.
	 */
	private setPageConfig(notePath: string, config: ParsedYamlConfig): void {
		this.pageConfigs.set(notePath, config);
	}

	/**
	 * Gets the page-level config defaults for a given note path.
	 *
	 * Fast path: returns from the in-memory cache if the ufence-ufence
	 * processor has already run for this page.
	 *
	 * Slow path: Obsidian doesn't guarantee code block processing order,
	 * so the ufence-ufence block may not have been processed yet. In that
	 * case, reads the file content directly via {@link parsePageConfigFromContent}
	 * and caches the result.
	 *
	 * @param notePath - Vault-relative path of the note.
	 * @returns The parsed page-level config, or `undefined` if the page
	 *          has no ufence-ufence block.
	 */
	private async getPageConfig(notePath: string): Promise<ParsedYamlConfig | undefined> {
		// Fast path — already cached by the ufence-ufence processor
		const cached = this.pageConfigs.get(notePath);
		if (cached) return cached;

		// Slow path — read file and find ufence-ufence blocks ourselves
		const file = this.app.vault.getAbstractFileByPath(notePath);
		if (!(file instanceof TFile)) return undefined;

		try {
			const content = await this.app.vault.cachedRead(file);
			const config = this.parsePageConfigFromContent(content);
			if (config) {
				this.pageConfigs.set(notePath, config);
			}
			return config;
		} catch {
			return undefined;
		}
	}

	/**
	 * Parses page-level config from raw file content by finding
	 * ufence-ufence code blocks and extracting their YAML.
	 *
	 * Only the first ufence-ufence block is used (one config block per page).
	 *
	 * @param content - The full markdown content of a note.
	 * @returns The parsed config from the first ufence-ufence block,
	 *          or `undefined` if none is found or parsing fails.
	 */
	private parsePageConfigFromContent(content: string): ParsedYamlConfig | undefined {
		const regex = /```ufence-ufence\s*\n([\s\S]*?)```/;
		const match = regex.exec(content);
		if (!match) return undefined;

		try {
			const raw: unknown = parseYaml(match[1]);
			if (raw && typeof raw === 'object') {
				const record = raw as Record<string, unknown>;
				normaliseConfigRecord(record);

				return parseNestedYamlConfig(record);
			}
		} catch {
			// Silently ignore parse errors
		}

		return undefined;
	}

	/**
	 * Re-renders all tracked ufence blocks for a given note path.
	 *
	 * Bypasses Obsidian's code block caching entirely — clears each
	 * container's DOM and re-runs {@link processUfenceBlock} with the
	 * current settings and page config. Stale entries (detached from
	 * DOM) are pruned automatically via `isConnected`.
	 *
	 * @param notePath - Vault-relative path of the note whose blocks
	 *                   should be refreshed.
	 */
	private async refreshBlocksForPath(notePath: string): Promise<void> {
		const blocks = this.renderedBlocks.get(notePath);
		if (!blocks) return;

		// Snapshot only DOM-connected blocks and clear the list.
		// Re-rendering calls processUfenceBlock which re-registers each
		// block fresh, so no duplicates accumulate. The delete-before-
		// re-render pattern is safe because Obsidian's markdown post-
		// processors run on the main thread (no concurrent re-entry).
		const active = blocks.filter(b => b.container.isConnected);
		this.renderedBlocks.delete(notePath);

		for (const block of active) {
			block.container.empty();
			await this.processUfenceBlock(
				block.rawContent,
				block.container,
				block.context,
				block.defaultLanguage
			);
		}
	}

	/**
	 * Re-renders ufence blocks across ALL tracked pages.
	 *
	 * Called after settings changes so that every visible ufence block
	 * reflects the updated defaults immediately.
	 */
	private async refreshAllBlocks(): Promise<void> {
		for (const path of [...this.renderedBlocks.keys()]) {
			await this.refreshBlocksForPath(path);
		}
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
		// Track this block so we can re-render it on demand (Force Refresh / settings change)
		const path = processorContext.sourcePath;
		if (!this.renderedBlocks.has(path)) {
			this.renderedBlocks.set(path, []);
		}
		this.renderedBlocks.get(path)?.push({
			container: containerElement,
			rawContent,
			context: processorContext,
			defaultLanguage,
		});

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
		const pageConfig = await this.getPageConfig(processorContext.sourcePath);
		const mergedConfig = resolvePreset(
			yamlConfig,
			this.settings.presets,
			pageConfig
		);

		const config = resolveBlockConfig(mergedConfig, this.settings, defaultLanguage);

		let sourceCode = '';
		let fileMetadata: SourceFileMetadata;

		// Determine source
		if (parsedBlock.hasEmbeddedCode) {
			sourceCode = parsedBlock.embeddedCode ?? '';
			fileMetadata = createEmbeddedCodeMetadata(config.titleTemplate, config.language);
		} else {
			if (!config.sourcePath) {
				await this.renderErrorMessage(containerElement, 'invalid source - use META.PATH or ~~~ separator for inline code');
				return;
			}

			const loadResult = await loadSource(this.app, config.sourcePath);

			if (!loadResult.succeeded) {
				await this.renderErrorMessage(containerElement, loadResult.errorMessage ?? 'failed to load source');
				return;
			}

			sourceCode = loadResult.sourceCode;
			fileMetadata = loadResult.fileMetadata ?? createEmbeddedCodeMetadata('', config.language);
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

		// Render the code block with a short-lived component — unloaded immediately
		// after rendering since the output is static HTML with no ongoing lifecycle.
		const renderComponent = new Component();
		renderComponent.load();
		await MarkdownRenderer.render(
			this.app,
			'```' + config.language + '\n' + sourceCode + '\n```',
			containerElement,
			'',
			renderComponent
		);
		renderComponent.unload();

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
		const downloadName = fileMetadata.filename || displayTitle || '';
		const suggestedFilename = buildSuggestedFilename(downloadName, config.language);
		const onDownload = this.settings.showDownloadButton
			? (codeText: string) => {
				downloadCodeToFile(codeText, suggestedFilename);
			}
			: undefined;

		// Add title or just buttons
		if (!shouldHideTitle && displayTitle) {
			const clickablePath = parsedBlock.hasEmbeddedCode || !config.sourcePath
				? undefined
				: (isRemotePath(config.sourcePath)
					? config.sourcePath
					: config.sourcePath.replace(/^vault:\/\//, ''));

			await this.attachTitleBarToCodeBlock(containerElement, {
				titleText: displayTitle,
				clickablePath,
				titleBarStyle: config.titleBarStyle,
				fileMetadata,
				language: config.language,
				descriptionText: config.descriptionText,
				containingNotePath: processorContext.sourcePath,
				showCopyButton: config.showCopyButton,
				totalLineCount,
				foldLines: config.foldLines,
				shiftCopyJoin: config.shiftCopyJoin,
				altCopyJoin: config.altCopyJoin,
				joinIgnoreRegex: config.joinIgnoreRegex,
				showDownloadButton: this.settings.showDownloadButton,
				onDownload,
			});
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
			outputCode = parsedBlock.hasEmbeddedCode ? (parsedBlock.embeddedCode ?? '') : rawContent;

			// Parse nested YAML configuration and resolve with defaults
			const yamlConfig = parseNestedYamlConfig(parsedBlock.yamlProperties);
			config = resolveCmdoutConfig(yamlConfig, this.settings);
		} catch {
			// Fallback: treat entire content as output with default config
			outputCode = rawContent;
			config = resolveCmdoutConfig({}, this.settings);
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
		const titleMatch = /TITLE:\s*"([^"]*)"/i.exec(firstLine);
		if (!titleMatch) return;

		const extractedTitle = titleMatch[1];
		if (!extractedTitle) return;

		// Extract style
		let titleBarStyle = this.settings.defaultTitleBarStyle;
		const styleMatch = /STYLE:\s*"([^"]*)"/i.exec(firstLine);
		if (styleMatch) {
			titleBarStyle = styleMatch[1].toLowerCase() as TitleBarStyle;
		}

		// Extract description
		let descriptionText: string | undefined;
		const descMatch = /(?:DESCRIPTION|DESC):\s*"([^"]*)"/i.exec(firstLine);
		if (descMatch) {
			descriptionText = descMatch[1];
		}

		await this.attachTitleBarToCodeBlock(element, {
			titleText: extractedTitle,
			titleBarStyle,
			descriptionText,
			containingNotePath: processorContext.sourcePath,
			showCopyButton: this.settings.showCopyButton,
			totalLineCount: 0,  // not tracked for reading mode
			foldLines: this.settings.foldLines,
		});
	}

	// ===========================================================================
	// Helper Methods
	// ===========================================================================

	/**
	 * Wraps a code block's `<pre>` element in a title container and
	 * attaches copy / fold / download buttons.
	 *
	 * The title bar is built by {@link buildTitleContainer} using the
	 * plugin's global style settings plus the per-block overrides in
	 * {@link config}. The `<pre>` is then wrapped so the title sits
	 * directly above the code.
	 *
	 * @param containerElement - The top-level element Obsidian gave the processor.
	 * @param config           - Per-block title bar and button options.
	 */
	private async attachTitleBarToCodeBlock(
		containerElement: HTMLElement,
		config: AttachTitleBarConfig
	): Promise<void> {
		const preElement = findPreElement(containerElement);
		if (!preElement) return;

		const titleContainer = await buildTitleContainer(this.app, this.settings, {
			titleText: config.titleText,
			clickablePath: config.clickablePath,
			titleBarStyle: config.titleBarStyle,
			fileMetadata: config.fileMetadata,
			language: config.language,
			descriptionText: config.descriptionText,
			containingNotePath: config.containingNotePath,
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
			showCopyButton: config.showCopyButton,
			showDownloadButton: config.showDownloadButton ?? false,
			totalLineCount: config.totalLineCount,
			foldLines: config.foldLines,
			shiftCopyJoin: config.shiftCopyJoin,
			altCopyJoin: config.altCopyJoin,
			joinIgnoreRegex: config.joinIgnoreRegex,
			onDownload: config.onDownload,
		});
	}

	/**
	 * Renders an inline error message inside a code block container.
	 *
	 * Uses Obsidian's {@link MarkdownRenderer} with a short-lived
	 * {@link Component} (loaded then immediately unloaded, since the
	 * rendered output is static and needs no ongoing lifecycle).
	 *
	 * @param containerElement - The element to render the error into.
	 * @param errorText        - Human-readable error description.
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
		errorComponent.unload();
	}
}
