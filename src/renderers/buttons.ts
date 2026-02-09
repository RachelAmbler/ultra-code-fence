/**
 * Ultra Code Fence - Button Renderers
 *
 * Creates copy and fold buttons for code blocks.
 * Handles user interaction and state management.
 */

import { Platform } from 'obsidian';
import { CSS_CLASSES, COPY_SUCCESS_DURATION_MS } from '../constants';
import { extractCodeText } from '../utils';

// =============================================================================
// SVG Icons
// =============================================================================

/**
 * Copy icon SVG (two overlapping rectangles).
 */
const COPY_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

/**
 * Checkmark icon SVG (success state).
 */
const CHECKMARK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

/**
 * Chevron down icon SVG (expand).
 */
const CHEVRON_DOWN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

/**
 * Chevron up icon SVG (collapse).
 */
const CHEVRON_UP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;

/**
 * Download icon SVG (arrow down to tray).
 */
const DOWNLOAD_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

// =============================================================================
// Copy Button
// =============================================================================

/**
 * Options for copy button behaviour.
 */
export interface CopyButtonOptions {
	/** Join operator for Shift+click (e.g., "&&"). Empty = disabled. */
	shiftCopyJoin?: string;

	/** Join operator for Alt/Cmd+click (e.g., ";"). Empty = disabled. */
	altCopyJoin?: string;

	/** Regex pattern matching lines to ignore during joined copies. Empty = disabled. */
	joinIgnoreRegex?: string;
}

/**
 * Joins lines of code with an operator, filtering out empty lines
 * and optionally stripping lines matching an ignore pattern.
 *
 * @param codeText - Raw code text with newlines
 * @param joinOperator - Operator to join lines with (e.g., "&&", ";")
 * @param ignoreRegex - Optional regex pattern to identify lines to strip
 * @returns Single-line string with lines joined by the operator
 */
export function joinCodeLines(codeText: string, joinOperator: string, ignoreRegex?: RegExp): string {
	return codeText
		.split('\n')
		.map(line => line.trim())
		.filter(line => line.length > 0)
		.filter(line => !ignoreRegex || !ignoreRegex.test(line))
		.join(` ${joinOperator} `);
}

/**
 * Creates and attaches a copy button to a pre element.
 *
 * The button appears on hover and copies the code content to clipboard.
 * Shows a checkmark briefly to confirm the copy succeeded.
 *
 * Modifier keys change copy behaviour:
 * - Shift+click: joins lines with the shiftCopyJoin operator
 * - Alt/Cmd+click: joins lines with the altCopyJoin operator
 *
 * @param preElement - The pre element to attach the button to
 * @param options - Optional copy join configuration
 */
export function addCopyButton(preElement: HTMLPreElement, options?: CopyButtonOptions): void {
	const copyButton = document.createElement('button');
	copyButton.className = CSS_CLASSES.copyButton;
	copyButton.setAttribute('aria-label', 'Copy code');
	copyButton.innerHTML = COPY_ICON_SVG;

	// Build tooltip showing available copy modes
	const tooltipParts: string[] = [];
	if (options?.shiftCopyJoin) {
		tooltipParts.push(`⇧: Join lines with ${options.shiftCopyJoin}`);
	}
	if (options?.altCopyJoin) {
		const modKey = (Platform.isMacOS || Platform.isIosApp) ? '⌘' : 'Alt';
		tooltipParts.push(`${modKey}: Join lines with ${options.altCopyJoin}`);
	}
	if (tooltipParts.length > 0) {
		copyButton.setAttribute('title', tooltipParts.join('\n'));
	}

	copyButton.addEventListener('click', async (event) => {
		event.preventDefault();
		event.stopPropagation();

		const codeElement = preElement.querySelector('code');

		if (codeElement) {
			let codeText = extractCodeText(codeElement);

			// Build ignore regex once (used only for joined copies)
			let ignoreRegex: RegExp | undefined;
			if (options?.joinIgnoreRegex) {
				try {
					ignoreRegex = new RegExp(options.joinIgnoreRegex);
				} catch {
					// Invalid regex — skip line filtering
				}
			}

			// Shift+click: join lines with shift operator
			if (event.shiftKey && options?.shiftCopyJoin) {
				codeText = joinCodeLines(codeText, options.shiftCopyJoin, ignoreRegex);
			}
			// Alt/Cmd+click: join lines with alt operator
			else if ((event.altKey || event.metaKey) && options?.altCopyJoin) {
				codeText = joinCodeLines(codeText, options.altCopyJoin, ignoreRegex);
			}

			await navigator.clipboard.writeText(codeText);

			// Show success state
			copyButton.classList.add(CSS_CLASSES.copied);
			copyButton.innerHTML = CHECKMARK_ICON_SVG;

			// Reset after delay
			setTimeout(() => {
				copyButton.classList.remove(CSS_CLASSES.copied);
				copyButton.innerHTML = COPY_ICON_SVG;
			}, COPY_SUCCESS_DURATION_MS);
		}
	});

	preElement.appendChild(copyButton);
}

// =============================================================================
// Fold Button
// =============================================================================

/**
 * Creates the "show more" button text with a chevron icon.
 *
 * @param hiddenLineCount - Number of lines hidden by the fold
 * @returns HTML string with SVG icon and line count label
 */
function buildExpandButtonContent(hiddenLineCount: number): string {
	return `${CHEVRON_DOWN_SVG}<span>Show more (${hiddenLineCount} more lines)</span>`;
}

/**
 * Creates the "show less" button text with a chevron icon.
 *
 * @returns HTML string with SVG icon and "Show less" label
 */
function buildCollapseButtonContent(): string {
	return `${CHEVRON_UP_SVG}<span>Show less</span>`;
}

/**
 * Creates and attaches a fold button to a pre element.
 *
 * The fold feature collapses long code blocks to a configurable number
 * of visible lines, with a button to expand/collapse.
 *
 * @param preElement - The pre element to attach folding to
 * @param totalLineCount - Total number of lines in the code
 * @param visibleLinesWhenFolded - Number of lines to show when folded
 */
export function addFoldButton(
	preElement: HTMLPreElement,
	totalLineCount: number,
	visibleLinesWhenFolded: number
): void {
	const codeElement = preElement.querySelector('code');

	if (!codeElement) return;

	// Calculate folded height based on line height
	const computedStyle = getComputedStyle(codeElement);
	const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
	const FOLD_PADDING_PX = 16;
	const foldedHeight = (visibleLinesWhenFolded * lineHeight) + FOLD_PADDING_PX;

	// Start in folded state
	preElement.classList.add(CSS_CLASSES.folded);
	preElement.style.setProperty('--ucf-folded-height', `${foldedHeight}px`);

	// Calculate hidden lines
	const hiddenLineCount = totalLineCount - visibleLinesWhenFolded;

	// Create fold bar container
	const foldBar = document.createElement('div');
	foldBar.className = CSS_CLASSES.foldBar;

	// Create fold button
	const foldButton = document.createElement('button');
	foldButton.className = CSS_CLASSES.foldButton;
	foldButton.innerHTML = buildExpandButtonContent(hiddenLineCount);

	foldButton.addEventListener('click', (event) => {
		event.preventDefault();
		event.stopPropagation();

		const isFolded = preElement.classList.toggle(CSS_CLASSES.folded);

		if (isFolded) {
			foldButton.innerHTML = buildExpandButtonContent(hiddenLineCount);
		} else {
			foldButton.innerHTML = buildCollapseButtonContent();
		}
	});

	foldBar.appendChild(foldButton);
	preElement.appendChild(foldBar);
}

// =============================================================================
// Download Button
// =============================================================================

/**
 * Callback invoked when the download button is clicked.
 *
 * The caller provides the actual download logic (platform detection,
 * save dialog, etc.) via this callback.
 */
export type DownloadCallback = (codeText: string) => Promise<void>;

/**
 * Creates and attaches a download button to a pre element.
 *
 * The button appears on hover next to the copy button. Clicking it
 * triggers the provided callback with the code block's text content.
 *
 * @param preElement - The pre element to attach the button to
 * @param onDownload - Callback that performs the actual download
 */
export function addDownloadButton(preElement: HTMLPreElement, onDownload: DownloadCallback): void {
	const downloadButton = document.createElement('button');
	downloadButton.className = CSS_CLASSES.downloadButton;
	downloadButton.setAttribute('aria-label', 'Download code');
	downloadButton.setAttribute('title', 'Save to file');
	downloadButton.innerHTML = DOWNLOAD_ICON_SVG;

	downloadButton.addEventListener('click', async (event) => {
		event.preventDefault();
		event.stopPropagation();

		const codeElement = preElement.querySelector('code');

		if (codeElement) {
			const codeText = extractCodeText(codeElement);
			await onDownload(codeText);
		}
	});

	preElement.appendChild(downloadButton);
}

// =============================================================================
// Combined Button Addition
// =============================================================================

/**
 * Options for adding buttons to a code block.
 */
export interface CodeButtonOptions {
	/** Whether to show copy button */
	showCopyButton: boolean;

	/** Whether to show download button */
	showDownloadButton: boolean;

	/** Total line count of the code block */
	totalLineCount: number;

	/**
	 * Number of lines to show when folded. 0 = no folding.
	 * Fold button only appears if totalLineCount > foldLines.
	 */
	foldLines: number;

	/** Join operator for Shift+click copy */
	shiftCopyJoin?: string;

	/** Join operator for Alt/Cmd+click copy */
	altCopyJoin?: string;

	/** Regex pattern matching lines to ignore during joined copies */
	joinIgnoreRegex?: string;

	/** Callback for download button. Required when showDownloadButton is true. */
	onDownload?: DownloadCallback;
}

/**
 * Adds copy, download, and/or fold buttons to a pre element.
 *
 * @param preElement - The pre element to enhance
 * @param options - Button configuration options
 */
export function addCodeBlockButtons(preElement: HTMLPreElement, options: CodeButtonOptions): void {
	const { showCopyButton, showDownloadButton, totalLineCount, foldLines, shiftCopyJoin, altCopyJoin, joinIgnoreRegex, onDownload } = options;

	if (showCopyButton) {
		addCopyButton(preElement, { shiftCopyJoin, altCopyJoin, joinIgnoreRegex });
	}

	if (showDownloadButton && onDownload) {
		addDownloadButton(preElement, onDownload);
	}

	// Show fold button if folding is enabled (foldLines > 0) and code exceeds fold threshold
	if (foldLines > 0 && totalLineCount > foldLines) {
		addFoldButton(preElement, totalLineCount, foldLines);
	}
}
