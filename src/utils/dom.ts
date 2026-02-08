/**
 * Ultra Code Fence - DOM Utilities
 *
 * Helper functions for creating and manipulating DOM elements.
 * Provides consistent patterns for common operations.
 */

import {
	CSS_CLASSES,
	LINE_HEIGHT_MULTIPLIER,
	SCROLL_BOTTOM_TOLERANCE,
} from '../constants';

// =============================================================================
// Scroll Behaviour
// =============================================================================

/**
 * Adds scroll behaviour to a pre element.
 *
 * Sets up max-height based on line count and adds a scroll indicator
 * that fades when the user reaches the bottom.
 *
 * @param preElement - The pre element to make scrollable
 * @param maxVisibleLines - Maximum number of visible lines
 */
export function addScrollBehaviour(preElement: HTMLPreElement, maxVisibleLines: number): void {
	preElement.classList.add(CSS_CLASSES.scrollable);

	// Calculate height based on line count (1.4em per line is a good estimate)
	const maxHeightEm = maxVisibleLines * LINE_HEIGHT_MULTIPLIER;
	preElement.style.setProperty('--ucf-scroll-height', `${maxHeightEm}em`);

	// Create scroll indicator (gradient fade at bottom)
	const scrollIndicator = document.createElement('div');
	scrollIndicator.className = CSS_CLASSES.scrollIndicator;
	preElement.appendChild(scrollIndicator);

	// Update indicator visibility on scroll
	preElement.addEventListener('scroll', () => {
		const isAtBottom =
			preElement.scrollHeight - preElement.scrollTop <= preElement.clientHeight + SCROLL_BOTTOM_TOLERANCE;
		scrollIndicator.classList.toggle(CSS_CLASSES.hidden, isAtBottom);
	});
}

// =============================================================================
// Line Wrapping
// =============================================================================

/**
 * Options for wrapping code lines.
 */
export interface LineWrappingOptions {
	/** Whether to show line numbers */
	showLineNumbers: boolean;

	/** Whether to show zebra stripes */
	showZebraStripes: boolean;

	/** Starting line number (default: 1) */
	startingLineNumber?: number;
}

/**
 * Wraps code element content into line spans with optional numbering.
 *
 * IMPORTANT: This function works directly with the DOM rather than string
 * manipulation. Obsidian's syntax highlighter produces spans that can cross
 * line boundaries (e.g., multi-line strings, comments). A naive approach of
 * splitting innerHTML on '\n' would break these spans, producing invalid HTML
 * like: `<span class="string">"line one` on one line and `line two"</span>`
 * on the next. This causes severe rendering issues where lines display
 * horizontally instead of vertically.
 *
 * The DOM-based approach walks the node tree, splits only text nodes on
 * newlines, and clones element nodes as needed to preserve syntax highlighting.
 *
 * @param codeElement - The code element containing highlighted source
 * @param options - Line wrapping options
 */
export function wrapCodeLinesInDom(codeElement: HTMLElement, options: LineWrappingOptions): void {
	const { showLineNumbers, showZebraStripes, startingLineNumber = 1 } = options;

	// Extract lines by walking the DOM and splitting on newlines
	const lines = extractLinesFromElement(codeElement);

	// Remove trailing empty line if present
	if (lines.length > 0 && isLineEmpty(lines[lines.length - 1])) {
		lines.pop();
	}

	// Clear the code element and rebuild with wrapped lines
	codeElement.innerHTML = '';

	lines.forEach((lineNodes, index) => {
		const lineNumber = startingLineNumber + index;
		const lineSpan = document.createElement('span');
		lineSpan.className = CSS_CLASSES.line;

		if (showZebraStripes && index % 2 === 1) {
			lineSpan.classList.add(CSS_CLASSES.lineAlt);
		}

		// Add line number if enabled
		if (showLineNumbers) {
			const numSpan = document.createElement('span');
			numSpan.className = CSS_CLASSES.lineNum;
			numSpan.textContent = String(lineNumber);
			lineSpan.appendChild(numSpan);
		}

		// Add line content
		const contentSpan = document.createElement('span');
		contentSpan.className = CSS_CLASSES.lineContent;

		if (lineNodes.length === 0) {
			// Empty line - use non-breaking space to maintain height
			contentSpan.innerHTML = '&nbsp;';
		} else {
			lineNodes.forEach(node => contentSpan.appendChild(node));
		}

		lineSpan.appendChild(contentSpan);
		codeElement.appendChild(lineSpan);
	});
}

/**
 * Extracts lines from a code element, preserving syntax highlighting.
 *
 * Walks through all child nodes, splitting text nodes on newlines and
 * cloning element nodes as needed to maintain proper structure. Handles
 * nested highlighting spans that may contain newlines by recursively
 * processing their children and wrapping each line's content in a clone
 * of the parent span.
 *
 * @param element - Element to extract lines from
 * @returns Array of arrays, where each inner array contains the DOM nodes for one line
 */
function extractLinesFromElement(element: HTMLElement): Node[][] {
	const lines: Node[][] = [[]];

	function processNode(node: Node): void {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent || '';
			const parts = text.split('\n');

			parts.forEach((part, partIndex) => {
				if (partIndex > 0) {
					// Start a new line
					lines.push([]);
				}

				if (part) {
					lines[lines.length - 1].push(document.createTextNode(part));
				}
			});
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const elem = node as HTMLElement;

			// Check if this element contains newlines
			const text = elem.textContent || '';

			if (!text.includes('\n')) {
				// No newlines - clone the entire element
				lines[lines.length - 1].push(elem.cloneNode(true));
			} else {
				// Element contains newlines - need to split it
				processElementWithNewlines(elem);
			}
		}
	}

	function processElementWithNewlines(elem: HTMLElement): void {
		// Process children, wrapping content in clones of this element
		let currentWrapper: HTMLElement | null = null;

		function ensureWrapper(): HTMLElement {
			if (!currentWrapper) {
				currentWrapper = elem.cloneNode(false) as HTMLElement;
				lines[lines.length - 1].push(currentWrapper);
			}
			return currentWrapper;
		}

		elem.childNodes.forEach(child => {
			if (child.nodeType === Node.TEXT_NODE) {
				const text = child.textContent || '';
				const parts = text.split('\n');

				parts.forEach((part, partIndex) => {
					if (partIndex > 0) {
						// Start a new line and reset wrapper
						lines.push([]);
						currentWrapper = null;
					}

					if (part) {
						ensureWrapper().appendChild(document.createTextNode(part));
					}
				});
			} else if (child.nodeType === Node.ELEMENT_NODE) {
				const childElem = child as HTMLElement;
				const childText = childElem.textContent || '';

				if (!childText.includes('\n')) {
					ensureWrapper().appendChild(childElem.cloneNode(true));
				} else {
					// Recursively handle nested elements with newlines
					// For simplicity, process as if unwrapped (loses one level of nesting)
					child.childNodes.forEach(grandchild => {
						if (grandchild.nodeType === Node.TEXT_NODE) {
							const gtext = grandchild.textContent || '';
							const gparts = gtext.split('\n');

							gparts.forEach((gpart, gpartIndex) => {
								if (gpartIndex > 0) {
									lines.push([]);
									currentWrapper = null;
								}

								if (gpart) {
									ensureWrapper().appendChild(document.createTextNode(gpart));
								}
							});
						} else {
							ensureWrapper().appendChild(grandchild.cloneNode(true));
						}
					});
				}
			}
		});
	}

	element.childNodes.forEach(child => processNode(child));

	return lines;
}

/**
 * Checks if a line (array of nodes) is effectively empty.
 */
function isLineEmpty(nodes: Node[]): boolean {
	if (nodes.length === 0) return true;

	const text = nodes.map(n => n.textContent || '').join('');
	return text === '';
}

/**
 * Processes a code element to add line numbers and zebra striping.
 *
 * Modifies the code element in place, also adding CSS classes to
 * the parent pre element.
 *
 * @param preElement - Parent pre element
 * @param codeElement - Code element containing the source
 * @param options - Line wrapping options
 */
export function processCodeElementLines(
	preElement: HTMLPreElement,
	codeElement: HTMLElement,
	options: LineWrappingOptions
): void {
	const { showLineNumbers, showZebraStripes } = options;

	// Add classes to pre for CSS styling
	if (showLineNumbers) {
		preElement.classList.add(CSS_CLASSES.lineNumbers);
	}

	if (showZebraStripes) {
		preElement.classList.add(CSS_CLASSES.zebra);
	}

	// Only wrap lines if we need to show line numbers or zebra stripes
	if (showLineNumbers || showZebraStripes) {
		wrapCodeLinesInDom(codeElement, options);
	}
}

// =============================================================================
// Element Queries
// =============================================================================

/**
 * Finds the code element within a container.
 *
 * @param containerElement - Container element to search
 * @returns The code element, or null if not found
 */
export function findCodeElement(containerElement: HTMLElement): HTMLElement | null {
	return containerElement.querySelector('pre > code');
}

/**
 * Finds the pre element within a container.
 *
 * @param containerElement - Container element to search
 * @returns The pre element, or null if not found
 */
export function findPreElement(containerElement: HTMLElement): HTMLPreElement | null {
	const codeElement = findCodeElement(containerElement);
	return codeElement?.parentElement as HTMLPreElement | null;
}

// =============================================================================
// Cleanup
// =============================================================================

/**
 * Removes existing title and description elements from a container.
 *
 * Used when re-rendering to ensure clean state.
 *
 * @param containerElement - Container to clean
 */
export function removeExistingTitleElements(containerElement: HTMLElement): void {
	containerElement.querySelectorAll(`.${CSS_CLASSES.title}`).forEach(el => el.remove());
	containerElement.querySelectorAll(`.${CSS_CLASSES.description}`).forEach(el => el.remove());
	containerElement.querySelectorAll(`.${CSS_CLASSES.container}`).forEach(el => {
		if (el !== containerElement) el.remove();
	});
}

// =============================================================================
// Container Creation
// =============================================================================

/**
 * Creates a styled container for a code block.
 *
 * @param titleBarStyle - Title style for CSS class
 * @param useThemeColours - Whether to use theme colours
 * @param customBackgroundColour - Custom background colour
 * @param customTextColour - Custom foreground colour
 * @returns Configured container element
 */
export function createCodeBlockContainer(
	titleBarStyle: string,
	useThemeColours: boolean,
	customBackgroundColour?: string,
	customTextColour?: string
): HTMLDivElement {
	const container = document.createElement('div');
	container.className = `${CSS_CLASSES.container} style-${titleBarStyle}`;

	if (!useThemeColours) {
		container.classList.add('custom-colors');

		if (customBackgroundColour) {
			container.style.setProperty('--custom-bg', customBackgroundColour);
		}

		if (customTextColour) {
			container.style.setProperty('--custom-fg', customTextColour);
		}
	}

	return container;
}

// =============================================================================
// Text Content Extraction
// =============================================================================

/**
 * Gets the text content of a code element, stripping HTML.
 *
 * @param codeElement - Code element
 * @returns Plain text content
 */
export function extractCodeText(codeElement: HTMLElement): string {
	return codeElement.textContent || '';
}
