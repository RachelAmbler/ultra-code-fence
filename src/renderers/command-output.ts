/**
 * Ultra Code Fence - Command Output Renderer
 *
 * Renders command-line output with styled prompts, commands, and output.
 * Supports customisable colours and formatting for each element type.
 */

import { App, MarkdownRenderer, Component } from 'obsidian';
import type { CommandOutputStyles, PluginSettings } from '../types';
import { CSS_CLASSES, styleClass } from '../constants';
import { escapeHtml, buildStyleString, addScrollBehaviour } from '../utils';
import { addCopyButton } from './buttons';

// =============================================================================
// Types
// =============================================================================

/**
 * Options for rendering command output.
 */
export interface CommandOutputRenderOptions {
	/** Title text (optional) */
	titleText?: string;

	/** Description text (optional) */
	descriptionText?: string;

	/** Regex pattern to identify command lines */
	promptPattern?: RegExp;

	/** Styling options */
	styles: CommandOutputStyles;

	/** Whether to show copy button */
	showCopyButton: boolean;

	/** Scroll lines: 0 = disabled, 1+ = scroll after N lines */
	scrollLines: number;

	/** Path of containing note (for description rendering) */
	containingNotePath?: string;
}

// =============================================================================
// Line Processing
// =============================================================================

/**
 * Processes a single line of command output.
 *
 * @param lineContent - The line content
 * @param promptPattern - Regex to identify command lines
 * @param styleStrings - Style strings for each element type
 * @returns HTML string for the line
 */
export function processOutputLine(
	lineContent: string,
	promptPattern: RegExp | undefined,
	styleStrings: { prompt: string; command: string; output: string }
): string {
	if (promptPattern) {
		const match = lineContent.match(promptPattern);

		if (match && match.length >= 3) {
			// Command line with prompt and command parts
			const promptPart = match[1] || '';
			const commandPart = match[2] || '';

			const promptSpan = createStyledSpanHtml(
				CSS_CLASSES.cmdoutPrompt,
				escapeHtml(promptPart),
				styleStrings.prompt
			);

			const commandSpan = createStyledSpanHtml(
				CSS_CLASSES.cmdoutCommand,
				escapeHtml(commandPart),
				styleStrings.command
			);

			return `<span class="${CSS_CLASSES.line} ${CSS_CLASSES.cmdoutLine} ${CSS_CLASSES.cmdoutCmdLine}">${promptSpan}${commandSpan}</span>`;
		}
	}

	// Output line (not matching prompt pattern)
	const content = lineContent === '' ? '&nbsp;' : escapeHtml(lineContent);

	return `<span class="${CSS_CLASSES.line} ${CSS_CLASSES.cmdoutLine} ${CSS_CLASSES.cmdoutOutput}"${styleStrings.output ? ` style="${styleStrings.output}"` : ''}>${content}</span>`;
}

/**
 * Creates a styled span element as HTML string.
 */
export function createStyledSpanHtml(className: string, content: string, styleAttribute: string): string {
	const styleAttr = styleAttribute ? ` style="${styleAttribute}"` : '';
	return `<span class="${className}"${styleAttr}>${content}</span>`;
}

/**
 * Processes all lines of command output.
 *
 * @param rawCode - The raw code content
 * @param promptPattern - Regex to identify command lines
 * @param styleStrings - Style strings for each element type
 * @returns HTML string with all processed lines
 */
export function processAllOutputLines(
	rawCode: string,
	promptPattern: RegExp | undefined,
	styleStrings: { prompt: string; command: string; output: string }
): string {
	const lines = rawCode.split('\n');

	// Remove trailing empty line
	if (lines.length > 0 && lines[lines.length - 1] === '') {
		lines.pop();
	}

	return lines
		.map(line => processOutputLine(line, promptPattern, styleStrings))
		.join('');
}

// =============================================================================
// Container Building
// =============================================================================

/**
 * Creates the main container for command output.
 *
 * @returns Container div element
 */
function createOutputContainer(): HTMLDivElement {
	const container = document.createElement('div');
	container.className = `${CSS_CLASSES.container} ${styleClass('tab')} ${CSS_CLASSES.cmdout}`;
	return container;
}

/**
 * Creates the pre/code structure for command output.
 *
 * @param processedHtml - Processed HTML content
 * @returns Pre element with code
 */
function createPreCodeStructure(processedHtml: string): HTMLPreElement {
	const preElement = document.createElement('pre');
	preElement.className = `${CSS_CLASSES.codeBlock} ${CSS_CLASSES.cmdoutPre}`;

	const codeElement = document.createElement('code');
	codeElement.innerHTML = processedHtml;

	preElement.appendChild(codeElement);

	return preElement;
}

/**
 * Creates a title element for command output.
 *
 * @param titleText - Title text
 * @returns Title div element
 */
function createCommandOutputTitle(titleText: string): HTMLDivElement {
	const titleElement = document.createElement('div');
	titleElement.className = `${CSS_CLASSES.title} ${styleClass('tab')}`;

	const leftGroup = document.createElement('div');
	leftGroup.className = CSS_CLASSES.titleLeft;

	// Terminal icon
	const iconSpan = document.createElement('span');
	iconSpan.className = CSS_CLASSES.icon;
	iconSpan.textContent = '💻';
	leftGroup.appendChild(iconSpan);

	// Title text
	const textSpan = document.createElement('span');
	textSpan.className = CSS_CLASSES.titleText;
	textSpan.textContent = titleText;
	leftGroup.appendChild(textSpan);

	titleElement.appendChild(leftGroup);

	return titleElement;
}

// =============================================================================
// Main Render Function
// =============================================================================

/**
 * Renders a complete command output block.
 *
 * @param app - Obsidian App instance
 * @param rawCode - Raw code content
 * @param options - Rendering options
 * @param component - Component for markdown rendering lifecycle
 * @returns Complete container element
 */
export async function renderCommandOutput(
	app: App,
	rawCode: string,
	options: CommandOutputRenderOptions,
	component: Component
): Promise<HTMLDivElement> {
	// Build style strings
	const styleStrings = {
		prompt: buildStyleString(
			options.styles.promptColour,
			options.styles.promptBold,
			options.styles.promptItalic
		),
		command: buildStyleString(
			options.styles.commandColour,
			options.styles.commandBold,
			options.styles.commandItalic
		),
		output: buildStyleString(
			options.styles.outputColour,
			options.styles.outputBold,
			options.styles.outputItalic
		),
	};

	// Process lines
	const processedHtml = processAllOutputLines(rawCode, options.promptPattern, styleStrings);

	// Build structure
	const container = createOutputContainer();
	const preElement = createPreCodeStructure(processedHtml);

	// Add title if provided
	if (options.titleText) {
		const titleElement = createCommandOutputTitle(options.titleText);
		container.appendChild(titleElement);

		// Add description if present
		if (options.descriptionText) {
			const descriptionElement = document.createElement('div');
			descriptionElement.className = CSS_CLASSES.description;

			await MarkdownRenderer.render(
				app,
				options.descriptionText,
				descriptionElement,
				options.containingNotePath || '',
				component
			);

			container.appendChild(descriptionElement);
		}
	}

	container.appendChild(preElement);

	// Apply scrolling if enabled (scrollLines > 0)
	if (options.scrollLines > 0) {
		addScrollBehaviour(preElement, options.scrollLines);
	}

	// Add copy button if enabled
	if (options.showCopyButton) {
		addCopyButton(preElement);
	}

	return container;
}

// =============================================================================
// Style Resolution
// =============================================================================

/**
 * Extracts command output styles from settings.
 *
 * @param settings - Plugin settings
 * @returns Command output style configuration
 */
export function getCommandOutputStylesFromSettings(settings: PluginSettings): CommandOutputStyles {
	return {
		promptColour: settings.commandPromptColour,
		promptBold: settings.commandPromptBold,
		promptItalic: settings.commandPromptItalic,
		commandColour: settings.commandTextColour,
		commandBold: settings.commandTextBold,
		commandItalic: settings.commandTextItalic,
		outputColour: settings.outputTextColour,
		outputBold: settings.outputTextBold,
		outputItalic: settings.outputTextItalic,
	};
}

/**
 * Merges per-block style overrides with default styles.
 *
 * @param defaultStyles - Default styles from settings
 * @param overrides - Per-block overrides from YAML
 * @returns Merged style configuration
 */
export function mergeCommandOutputStyles(
	defaultStyles: CommandOutputStyles,
	overrides: Partial<CommandOutputStyles>
): CommandOutputStyles {
	return {
		promptColour: overrides.promptColour ?? defaultStyles.promptColour,
		promptBold: overrides.promptBold ?? defaultStyles.promptBold,
		promptItalic: overrides.promptItalic ?? defaultStyles.promptItalic,
		commandColour: overrides.commandColour ?? defaultStyles.commandColour,
		commandBold: overrides.commandBold ?? defaultStyles.commandBold,
		commandItalic: overrides.commandItalic ?? defaultStyles.commandItalic,
		outputColour: overrides.outputColour ?? defaultStyles.outputColour,
		outputBold: overrides.outputBold ?? defaultStyles.outputBold,
		outputItalic: overrides.outputItalic ?? defaultStyles.outputItalic,
	};
}
