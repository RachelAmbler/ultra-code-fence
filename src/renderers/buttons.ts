/**
 * Ultra Code Fence - Button Renderers
 *
 * Creates copy and fold buttons for code blocks.
 * Handles user interaction and state management.
 */

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

// =============================================================================
// Copy Button
// =============================================================================

/**
 * Creates and attaches a copy button to a pre element.
 *
 * The button appears on hover and copies the code content to clipboard.
 * Shows a checkmark briefly to confirm the copy succeeded.
 *
 * @param preElement - The pre element to attach the button to
 */
export function addCopyButton(preElement: HTMLPreElement): void {
	const copyButton = document.createElement('button');
	copyButton.className = CSS_CLASSES.copyButton;
	copyButton.setAttribute('aria-label', 'Copy code');
	copyButton.innerHTML = COPY_ICON_SVG;

	copyButton.addEventListener('click', async (event) => {
		event.preventDefault();
		event.stopPropagation();

		const codeElement = preElement.querySelector('code');

		if (codeElement) {
			const codeText = extractCodeText(codeElement);
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
 * Creates the "show more" button text.
 */
function buildExpandButtonContent(hiddenLineCount: number): string {
	return `${CHEVRON_DOWN_SVG}<span>Show more (${hiddenLineCount} more lines)</span>`;
}

/**
 * Creates the "show less" button text.
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
	const foldedHeight = (visibleLinesWhenFolded * lineHeight) + 16; // Add padding

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
// Combined Button Addition
// =============================================================================

/**
 * Options for adding buttons to a code block.
 */
export interface CodeButtonOptions {
	/** Whether to show copy button */
	showCopyButton: boolean;

	/** Total line count of the code block */
	totalLineCount: number;

	/**
	 * Number of lines to show when folded. 0 = no folding.
	 * Fold button only appears if totalLineCount > foldLines.
	 */
	foldLines: number;
}

/**
 * Adds copy and/or fold buttons to a pre element.
 *
 * @param preElement - The pre element to enhance
 * @param options - Button configuration options
 */
export function addCodeBlockButtons(preElement: HTMLPreElement, options: CodeButtonOptions): void {
	const { showCopyButton, totalLineCount, foldLines } = options;

	// Ensure pre has relative positioning for button placement
	preElement.style.position = 'relative';

	if (showCopyButton) {
		addCopyButton(preElement);
	}

	// Show fold button if folding is enabled (foldLines > 0) and code exceeds fold threshold
	if (foldLines > 0 && totalLineCount > foldLines) {
		addFoldButton(preElement, totalLineCount, foldLines);
	}
}
