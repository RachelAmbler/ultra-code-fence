/**
 * Ultra Code Fence - Callout Renderer
 *
 * DOM manipulation functions for rendering callouts into code blocks.
 * Works with the line DOM structure created by wrapCodeLinesInDom():
 *
 *   <span class="ucf-line">
 *     <span class="ucf-line-num">N</span>
 *     <span class="ucf-line-content">...</span>
 *   </span>
 *
 * Callouts are injected into this structure according to their display mode:
 * - Inline: sibling <div> inserted AFTER the target line span
 * - Footnote: <sup> ref appended inside line content; section below code
 * - Popover: trigger appended inside line content; hidden content on <pre>
 */

import type { ResolvedCalloutConfig } from '../types';
import { CSS_CLASSES } from '../constants';
import { createElementFromHtml } from '../utils/dom';
import {
	groupCalloutsByLine,
	buildInlineCalloutHTML,
	buildFootnoteRefHTML,
	buildFootnoteSectionHTML,
	buildPopoverTriggerHTML,
	buildPopoverContentHTML,
	shouldReplaceLine,
} from '../utils/callout-processor';

// =============================================================================
// Main Injection Function
// =============================================================================

/**
 * Injects callouts into a code block.
 *
 * Must be called AFTER wrapCodeLinesInDom() has created the line structure
 * (i.e., after processCodeBlock or when line numbers/zebra stripes are enabled).
 *
 * For code blocks without line wrapping (no line numbers, no zebra), the
 * ucf-line spans won't exist and callouts cannot be injected.
 *
 * @param codeElement - The <code> element containing wrapped lines
 * @param preElement - The <pre> parent element
 * @param containerElement - The outer .ucf container element
 * @param config - Resolved callout configuration
 */
export function injectCallouts(
	codeElement: HTMLElement,
	preElement: HTMLElement,
	containerElement: HTMLElement,
	config: ResolvedCalloutConfig
): void {
	if (!config.enabled || config.entries.length === 0) {
		return;
	}

	const calloutsByLine = groupCalloutsByLine(config);
	const lines = Array.from(codeElement.querySelectorAll(`.${CSS_CLASSES.line}`));

	if (lines.length === 0) {
		// No wrapped lines — cannot inject callouts
		return;
	}

	// Track per-mode counters (footnote/popover still use numbering; inline uses type icons)
	let footnoteCounter = 1;
	let popoverCounter = 1;
	const footnoteEntries: Array<{ text: string; number: number }> = [];
	const popoverElements: HTMLElement[] = [];

	// Process each line that has callout entries, in line order
	const sortedLineNumbers = Array.from(calloutsByLine.keys()).sort((a, b) => a - b);

	for (const lineNum of sortedLineNumbers) {
		const lineElement = lines[lineNum - 1]; // 0-based index
		if (!lineElement) continue;

		const entries = calloutsByLine.get(lineNum)!;
		const lineContent = lineElement.querySelector(`.${CSS_CLASSES.lineContent}`);

		// Handle REPLACE: replace line content with callout text
		if (shouldReplaceLine(lineNum, calloutsByLine) && lineContent) {
			const replaceTexts = entries
				.filter(e => e.replace)
				.map(e => e.text);
			lineContent.textContent = replaceTexts.join(' ');
			lineContent.classList.add(CSS_CLASSES.calloutText);
		}

		// Process non-replace entries for this line
		for (const entry of entries) {
			if (entry.replace) continue; // Already handled above

			switch (entry.displayMode) {
				case 'inline':
					injectInlineCallout(codeElement, lineElement, entry.text, entry.type, config.style);
					break;

				case 'footnote':
					if (lineContent) {
						injectFootnoteRef(lineContent, footnoteCounter);
					}
					footnoteEntries.push({ text: entry.text, number: footnoteCounter });
					footnoteCounter++;
					break;

				case 'popover':
					if (lineContent) {
						const popoverEl = injectPopoverTrigger(lineContent, preElement, entry.text, entry.type, popoverCounter);
						if (popoverEl) {
							popoverElements.push(popoverEl);
						}
					}
					popoverCounter++;
					break;
			}
		}
	}

	// Append footnote section if we have any
	if (footnoteEntries.length > 0) {
		const sectionHTML = buildFootnoteSectionHTML(footnoteEntries);
		const sectionEl = createElementFromHtml(sectionHTML);
		if (sectionEl) {
			containerElement.appendChild(sectionEl);
		}
	}

	// Set up popover click interactions
	if (popoverElements.length > 0) {
		setupPopoverInteractions(preElement);
	}
}

// =============================================================================
// Inline Callout Injection
// =============================================================================

/**
 * Injects an inline callout as a sibling element after the target line.
 *
 * The callout is a separate row in the flex column, so line numbering
 * remains unaffected.
 *
 * @param codeElement - The <code> element (parent of line spans)
 * @param lineElement - The target .ucf-line element
 * @param text - Callout text
 * @param type - Callout type (note, warning, etc.)
 * @param style - Visual style: "standard" or "border"
 */
function injectInlineCallout(
	codeElement: HTMLElement,
	lineElement: Element,
	text: string,
	type: string,
	style: 'standard' | 'border' = 'standard'
): void {
	const html = buildInlineCalloutHTML(text, type, style);
	const calloutEl = createElementFromHtml(html);

	if (calloutEl) {
		// Insert after the line element (as sibling in the code element)
		if (lineElement.nextSibling) {
			codeElement.insertBefore(calloutEl, lineElement.nextSibling);
		} else {
			codeElement.appendChild(calloutEl);
		}
	}
}

// =============================================================================
// Footnote Injection
// =============================================================================

/**
 * Injects a footnote reference superscript into line content.
 *
 * @param lineContent - The .ucf-line-content element
 * @param calloutNumber - Footnote number
 */
function injectFootnoteRef(lineContent: Element, calloutNumber: number): void {
	const refHTML = buildFootnoteRefHTML(calloutNumber);
	const refEl = createElementFromHtml(refHTML);
	if (refEl) {
		lineContent.appendChild(refEl);
	}
}

// =============================================================================
// Popover Injection
// =============================================================================

/**
 * Injects a popover trigger and content element.
 *
 * The trigger is appended to the line content.
 * The popover content is appended to the pre element.
 *
 * @param lineContent - The .ucf-line-content element
 * @param preElement - The <pre> element
 * @param text - Popover text
 * @param calloutNumber - Callout number (used as ID)
 * @returns The popover content element (for interaction setup)
 */
function injectPopoverTrigger(
	lineContent: Element,
	preElement: HTMLElement,
	text: string,
	type: string,
	calloutNumber: number
): HTMLElement | null {
	// Add trigger to line content
	const triggerHTML = buildPopoverTriggerHTML(calloutNumber);
	const triggerEl = createElementFromHtml(triggerHTML);
	if (triggerEl) {
		lineContent.appendChild(triggerEl);
	}

	// Add popover content to pre element
	const contentHTML = buildPopoverContentHTML(text, type, calloutNumber);
	const contentEl = createElementFromHtml(contentHTML) as HTMLElement;
	if (contentEl) {
		preElement.appendChild(contentEl);
		return contentEl;
	}

	return null;
}

// =============================================================================
// Popover Interactions
// =============================================================================

/**
 * Sets up click interactions for all popover triggers within a pre element.
 *
 * Click on trigger: toggles the matching popover visibility.
 * Click elsewhere: hides all open popovers.
 *
 * @param preElement - The <pre> element containing triggers and popovers
 */
function setupPopoverInteractions(preElement: HTMLElement): void {
	const triggers = Array.from(preElement.querySelectorAll(`.${CSS_CLASSES.calloutTrigger}`));
	const popovers = Array.from(preElement.querySelectorAll(`.${CSS_CLASSES.calloutPopover}`));

	const VISIBLE_CLASS = 'ucf-popover-visible';

	for (const trigger of triggers) {
		const id = trigger.getAttribute('data-callout-id');
		const popover = popovers.find(p => p.getAttribute('data-callout-id') === id) as HTMLElement;

		if (popover) {
			trigger.addEventListener('click', (e) => {
				e.stopPropagation();
				const isVisible = popover.classList.contains(VISIBLE_CLASS);
				// Hide all other popovers first
				for (const p of popovers) {
					(p as HTMLElement).classList.remove(VISIBLE_CLASS);
				}
				if (!isVisible) {
					popover.classList.add(VISIBLE_CLASS);
				}
			});
		}
	}

	// Close popovers when clicking outside
	preElement.addEventListener('click', () => {
		for (const p of popovers) {
			(p as HTMLElement).classList.remove(VISIBLE_CLASS);
		}
	});
}
