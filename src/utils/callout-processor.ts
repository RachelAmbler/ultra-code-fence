/**
 * Ultra Code Fence - Callout Processor
 *
 * Pure utility functions for processing callouts. These functions have no
 * DOM dependency and are fully testable in a node environment.
 *
 * Responsibilities:
 * - Grouping callout entries by target line
 * - Building HTML strings for inline, footnote, and popover callouts
 * - Determining line replacement behaviour
 */

import type { ResolvedCalloutConfig, ResolvedCalloutEntry } from '../types';
import { CSS_CLASSES } from '../constants';
import { getCalloutColor, getCalloutIcon } from '../constants/callout-types';
import { formatCalloutMarkdown } from './formatting';

// =============================================================================
// Callout Grouping
// =============================================================================

/**
 * Groups callout entries by their target line number.
 *
 * A single entry may target multiple lines (from LINES ranges), so it
 * will appear in multiple groups. Entries targeting the same line are
 * grouped together in order of definition.
 *
 * @param config - Resolved callout configuration
 * @returns Map of line number (1-based) to entries targeting that line
 */
export function groupCalloutsByLine(config: ResolvedCalloutConfig): Map<number, ResolvedCalloutEntry[]> {
	const groups = new Map<number, ResolvedCalloutEntry[]>();

	for (const entry of config.entries) {
		for (const lineNum of entry.targetLines) {
			if (!groups.has(lineNum)) {
				groups.set(lineNum, []);
			}
			groups.get(lineNum)!.push(entry);
		}
	}

	return groups;
}

// =============================================================================
// Inline Callout HTML
// =============================================================================

/**
 * Builds HTML for an inline callout element with type-based styling.
 *
 * Inline callouts appear as a distinct row between code lines with:
 * - Left border coloured by the callout type
 * - Small SVG icon matching the callout type
 * - Formatted annotation text with basic Markdown support
 * - No numbering (icons only for inline mode)
 *
 * Two visual styles are supported:
 * - "standard": left border only (default)
 * - "border": thin border with rounded corners wrapping the callout
 *
 * @param text - Callout annotation text (supports basic Markdown)
 * @param type - Callout type (note, info, warning, etc.)
 * @param style - Visual style: "standard" or "border"
 * @returns HTML string for the inline callout element
 */
export function buildInlineCalloutHTML(text: string, type: string, style: 'standard' | 'border' = 'standard'): string {
	const color = getCalloutColor(type);
	const icon = getCalloutIcon(type);
	const formattedText = formatCalloutMarkdown(text);

	const cssClass = style === 'border' ? CSS_CLASSES.calloutInlineBorder : CSS_CLASSES.calloutInline;
	const inlineStyle = style === 'border'
		? `border-color: ${color}`
		: `border-left-color: ${color}`;

	return `<div class="${cssClass}" style="${inlineStyle}"><span class="${CSS_CLASSES.calloutIcon}" style="color: ${color}">${icon}</span> <span class="${CSS_CLASSES.calloutText}">${formattedText}</span></div>`;
}

// =============================================================================
// Footnote Callout HTML
// =============================================================================

/**
 * Builds HTML for a footnote reference (superscript number).
 *
 * Placed inline within a code line's content to indicate a footnote.
 *
 * @param calloutNumber - Sequential callout number
 * @returns HTML string for the superscript reference
 */
export function buildFootnoteRefHTML(calloutNumber: number): string {
	return `<sup class="${CSS_CLASSES.calloutRef}">${calloutNumber}</sup>`;
}

/**
 * Builds HTML for a single footnote entry.
 *
 * Used within the footnote section below the code block.
 * Supports basic Markdown in text.
 *
 * @param text - Footnote text (supports basic Markdown)
 * @param calloutNumber - Footnote number
 * @returns HTML string for the footnote entry
 */
export function buildFootnoteEntryHTML(text: string, calloutNumber: number): string {
	const formattedText = formatCalloutMarkdown(text);
	return `<div class="${CSS_CLASSES.calloutEntry}"><span class="${CSS_CLASSES.calloutNumber}">${calloutNumber}.</span> <span class="${CSS_CLASSES.calloutText}">${formattedText}</span></div>`;
}

/**
 * Builds the complete footnote section HTML to append below a code block.
 *
 * @param entries - Array of footnote entries with text and number
 * @returns HTML string for the complete footnote section
 */
export function buildFootnoteSectionHTML(entries: Array<{ text: string; number: number }>): string {
	const footnotes = entries
		.map(({ text, number }) => buildFootnoteEntryHTML(text, number))
		.join('\n');

	return `<div class="${CSS_CLASSES.calloutSection}">\n${footnotes}\n</div>`;
}

// =============================================================================
// Popover Callout HTML
// =============================================================================

/**
 * Builds HTML for a popover trigger element.
 *
 * Placed inline within a code line's content. Clicking the trigger
 * toggles the associated popover content.
 *
 * @param calloutNumber - Sequential callout number (used as ID)
 * @returns HTML string for the trigger element
 */
export function buildPopoverTriggerHTML(calloutNumber: number): string {
	return `<span class="${CSS_CLASSES.calloutTrigger}" data-callout-id="${calloutNumber}">𝘖</span>`;
}

/**
 * Builds HTML for a popover content element.
 *
 * Initially hidden; shown when its matching trigger is clicked.
 * Border colour matches the callout type. Supports basic Markdown in text.
 *
 * @param text - Popover content text (supports basic Markdown)
 * @param type - Callout type (for border styling)
 * @param calloutNumber - Sequential callout number (matches trigger ID)
 * @returns HTML string for the popover content element
 */
export function buildPopoverContentHTML(text: string, type: string, calloutNumber: number): string {
	const color = getCalloutColor(type);
	const formattedText = formatCalloutMarkdown(text);
	return `<div class="${CSS_CLASSES.calloutPopover}" data-callout-id="${calloutNumber}" style="border-left-color: ${color}"><span class="${CSS_CLASSES.calloutText}">${formattedText}</span></div>`;
}

// =============================================================================
// Line Replacement
// =============================================================================

/**
 * Determines if a line should be replaced by callout content.
 *
 * A line is replaceable if any callout entry targeting it has REPLACE: true.
 *
 * @param lineNum - Line number (1-based)
 * @param calloutsByLine - Grouped callouts from groupCalloutsByLine()
 * @returns True if the line content should be replaced
 */
export function shouldReplaceLine(lineNum: number, calloutsByLine: Map<number, ResolvedCalloutEntry[]>): boolean {
	const entries = calloutsByLine.get(lineNum);
	if (!entries) return false;
	return entries.some(entry => entry.replace);
}

// =============================================================================
// Display Mode Filtering
// =============================================================================

/**
 * Filters callout entries by display mode.
 *
 * @param entries - All callout entries
 * @param mode - Target display mode
 * @returns Entries matching the specified mode
 */
export function filterByDisplayMode(
	entries: ResolvedCalloutEntry[],
	mode: 'inline' | 'footnote' | 'popover'
): ResolvedCalloutEntry[] {
	return entries.filter(entry => entry.displayMode === mode);
}
