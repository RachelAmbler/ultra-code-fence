/**
 * Ultra Code Fence - Code Block Renderer
 *
 * Processes code blocks to add line numbers, zebra striping,
 * scrolling, and other visual enhancements.
 */

import { CSS_CLASSES } from '../constants';
import { addScrollBehaviour, processCodeElementLines, findCodeElement } from '../utils';

// =============================================================================
// Code Block Processing
// =============================================================================

/**
 * Options for processing a code block.
 */
export interface CodeBlockProcessingOptions {
	/** Whether to show line numbers */
	showLineNumbers: boolean;

	/** Whether to show zebra stripes */
	showZebraStripes: boolean;

	/** Starting line number (default: 1) */
	startingLineNumber?: number;

	/** Scroll lines: 0 = disabled, 1+ = scroll after N lines */
	scrollLines: number;
}

/**
 * Processes a code block element to add visual enhancements.
 *
 * Applies line numbers, zebra striping, and scroll behaviour
 * based on the provided options.
 *
 * @param containerElement - Container element with pre > code structure
 * @param options - Processing options
 */
export function processCodeBlock(containerElement: HTMLElement, options: CodeBlockProcessingOptions): void {
	const codeElement = findCodeElement(containerElement);

	if (!codeElement) return;

	const preElement = codeElement.parentElement as HTMLPreElement;

	// Add base class for styling
	preElement.classList.add(CSS_CLASSES.codeBlock);

	// Apply scrolling if enabled (scrollLines > 0)
	if (options.scrollLines > 0) {
		addScrollBehaviour(preElement, options.scrollLines);
	}

	// Apply line numbers and zebra stripes
	if (options.showLineNumbers || options.showZebraStripes) {
		processCodeElementLines(preElement, codeElement, {
			showLineNumbers: options.showLineNumbers,
			showZebraStripes: options.showZebraStripes,
			startingLineNumber: options.startingLineNumber ?? 1,
		});
	}
}

/**
 * Counts the number of lines in source code.
 *
 * @param sourceCode - The source code string
 * @returns Number of lines
 */
export function countSourceLines(sourceCode: string): number {
	if (!sourceCode) return 0;
	return sourceCode.split('\n').length;
}

// =============================================================================
// Container Wrapping
// =============================================================================

/**
 * Wraps a pre element in a styled container.
 *
 * @param preElement - The pre element to wrap
 * @param containerElement - Container element to wrap with
 */
export function wrapPreElement(preElement: HTMLPreElement, containerElement: HTMLElement): void {
	preElement.parentElement?.insertBefore(containerElement, preElement);
	containerElement.appendChild(preElement);
	preElement.classList.add(CSS_CLASSES.codeBlock);
	preElement.style.position = 'relative';
}

// =============================================================================
// Default Options
// =============================================================================

/**
 * Creates default code block options from settings values.
 *
 * @param showLineNumbers - Whether to show line numbers
 * @param showZebraStripes - Whether to show zebra stripes
 * @param scrollLines - Scroll lines (0 = disabled, 1+ = scroll after N lines)
 * @returns Code block options object
 */
export function createCodeBlockProcessingOptions(
	showLineNumbers: boolean,
	showZebraStripes: boolean,
	scrollLines: number
): CodeBlockProcessingOptions {
	return {
		showLineNumbers,
		showZebraStripes,
		startingLineNumber: 1,
		scrollLines,
	};
}
