// @vitest-environment jsdom

/**
 * Comprehensive jsdom tests for src/renderers/callout-renderer.ts
 *
 * Tests the injectCallouts() function which injects callouts into code block DOM.
 * Covers: inline, footnote, and popover display modes; replace functionality;
 * popover interactions (click to show/hide, click outside to close).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { injectCallouts } from '../../src/renderers/callout-renderer';
import type { ResolvedCalloutConfig, ResolvedCalloutEntry } from '../../src/types';

/**
 * Creates a mock code element with wrapped line structure:
 * <code>
 *   <span class="ucf-line">
 *     <span class="ucf-line-num">1</span>
 *     <span class="ucf-line-content">line content</span>
 *   </span>
 * </code>
 */
function createMockCodeElement(lineTexts: string[]): HTMLElement {
	const code = document.createElement('code');
	lineTexts.forEach((text, index) => {
		const line = document.createElement('span');
		line.className = 'ucf-line';

		const lineNum = document.createElement('span');
		lineNum.className = 'ucf-line-num';
		lineNum.textContent = String(index + 1);

		const lineContent = document.createElement('span');
		lineContent.className = 'ucf-line-content';
		lineContent.textContent = text;

		line.appendChild(lineNum);
		line.appendChild(lineContent);
		code.appendChild(line);
	});
	return code;
}

/**
 * Creates a minimal resolved callout config for testing.
 */
function createCalloutConfig(overrides?: Partial<ResolvedCalloutConfig>): ResolvedCalloutConfig {
	return {
		enabled: true,
		displayMode: 'inline',
		printDisplayMode: 'inline',
		style: 'standard',
		entries: [],
		...overrides,
	};
}

/**
 * Creates a resolved callout entry for testing.
 */
function createCalloutEntry(overrides?: Partial<ResolvedCalloutEntry>): ResolvedCalloutEntry {
	return {
		enabled: true,
		targetLines: [1],
		text: 'Test callout',
		replace: false,
		displayMode: 'inline',
		type: 'note',
		...overrides,
	};
}

describe('injectCallouts', () => {
	let container: HTMLElement;
	let pre: HTMLElement;
	let code: HTMLElement;

	beforeEach(() => {
		// Create DOM structure:
		// <div class="ucf">
		//   <pre>
		//     <code>...</code>
		//   </pre>
		// </div>
		container = document.createElement('div');
		container.className = 'ucf';

		pre = document.createElement('pre');
		code = createMockCodeElement(['line one', 'line two', 'line three']);
		pre.appendChild(code);
		container.appendChild(pre);

		document.body.appendChild(container);
	});

	// =========================================================================
	// NO-OP CASES: Early returns
	// =========================================================================

	describe('No-op cases', () => {
		it('returns early if config.enabled is false', () => {
			const config = createCalloutConfig({
				enabled: false,
				entries: [createCalloutEntry()],
			});

			injectCallouts(code, pre, container, config);

			// Should be no callouts injected
			expect(code.querySelectorAll('.ucf-callout-inline').length).toBe(0);
		});

		it('returns early if config.entries is empty', () => {
			const config = createCalloutConfig({
				enabled: true,
				entries: [],
			});

			injectCallouts(code, pre, container, config);

			// Should be no callouts injected
			expect(code.querySelectorAll('.ucf-callout-inline').length).toBe(0);
		});

		it('returns early if no .ucf-line elements are found', () => {
			const emptyCode = document.createElement('code');
			const config = createCalloutConfig({
				entries: [createCalloutEntry()],
			});

			injectCallouts(emptyCode, pre, container, config);

			// Should be no callouts injected
			expect(emptyCode.querySelectorAll('.ucf-callout-inline').length).toBe(0);
		});
	});

	// =========================================================================
	// INLINE CALLOUT INJECTION
	// =========================================================================

	describe('Inline callout injection', () => {
		it('injects an inline callout div after the target line element', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'inline',
						text: 'This is a note',
						type: 'note',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const callouts = code.querySelectorAll('.ucf-callout-inline');
			expect(callouts.length).toBe(1);

			// Check that callout is positioned after line 1
			const line1 = code.querySelectorAll('.ucf-line')[0];
			const callout = callouts[0] as HTMLElement;
			expect(line1.nextSibling).toBe(callout);
		});

		it('injects multiple inline callouts on different lines', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'inline',
						text: 'Callout on line 1',
					}),
					createCalloutEntry({
						targetLines: [3],
						displayMode: 'inline',
						text: 'Callout on line 3',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const callouts = code.querySelectorAll('.ucf-callout-inline');
			expect(callouts.length).toBe(2);
		});

		it('applies standard style when style is "standard"', () => {
			const config = createCalloutConfig({
				style: 'standard',
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'inline',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const callout = code.querySelector('.ucf-callout-inline') as HTMLElement;
			expect(callout).toBeTruthy();
			// Standard style should have border-left-color inline style
			expect(callout.style.borderLeftColor).toBeTruthy();
		});

		it('applies border style when style is "border"', () => {
			const config = createCalloutConfig({
				style: 'border',
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'inline',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const callout = code.querySelector('.ucf-callout-inline-border') as HTMLElement;
			expect(callout).toBeTruthy();
			// Border style should have border-color inline style
			expect(callout.style.borderColor).toBeTruthy();
		});

		it('includes callout icon and text content', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'inline',
						text: 'Important note',
						type: 'warning',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const callout = code.querySelector('.ucf-callout-inline') as HTMLElement;
			expect(callout.textContent).toContain('Important note');
			// Check that icon span exists
			const icon = callout.querySelector('.ucf-callout-icon');
			expect(icon).toBeTruthy();
		});

		it('handles callout on line 2', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [2],
						displayMode: 'inline',
						text: 'Line 2 callout',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const lines = code.querySelectorAll('.ucf-line');
			const line2 = lines[1]; // 0-indexed
			const callout = line2.nextSibling;
			expect(callout?.textContent).toContain('Line 2 callout');
		});

		it('handles multiple callouts on the same line', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'inline',
						text: 'First callout',
					}),
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'inline',
						text: 'Second callout',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const callouts = code.querySelectorAll('.ucf-callout-inline');
			expect(callouts.length).toBe(2);
		});
	});

	// =========================================================================
	// FOOTNOTE CALLOUT INJECTION
	// =========================================================================

	describe('Footnote callout injection', () => {
		it('injects a superscript ref into line content', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'footnote',
						text: 'First footnote',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const lineContent = code.querySelector('.ucf-line-content') as HTMLElement;
			const ref = lineContent.querySelector('.ucf-callout-ref');
			expect(ref).toBeTruthy();
			expect(ref?.textContent).toBe('1');
		});

		it('appends footnote section to container', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'footnote',
						text: 'Footnote text',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const section = container.querySelector('.ucf-callout-section');
			expect(section).toBeTruthy();
		});

		it('includes footnote number and text in section', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'footnote',
						text: 'Explanation of feature',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const section = container.querySelector('.ucf-callout-section');
			expect(section?.textContent).toContain('1');
			expect(section?.textContent).toContain('Explanation of feature');
		});

		it('creates numbered refs for multiple footnotes', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'footnote',
						text: 'First note',
					}),
					createCalloutEntry({
						targetLines: [2],
						displayMode: 'footnote',
						text: 'Second note',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const refs = code.querySelectorAll('.ucf-callout-ref');
			expect(refs.length).toBe(2);
			expect(refs[0].textContent).toBe('1');
			expect(refs[1].textContent).toBe('2');
		});

		it('appends refs to correct line content', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'footnote',
						text: 'Note 1',
					}),
					createCalloutEntry({
						targetLines: [3],
						displayMode: 'footnote',
						text: 'Note 3',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const lineContents = code.querySelectorAll('.ucf-line-content');
			expect(lineContents[0].querySelector('.ucf-callout-ref')).toBeTruthy();
			expect(lineContents[1].querySelector('.ucf-callout-ref')).toBeFalsy();
			expect(lineContents[2].querySelector('.ucf-callout-ref')).toBeTruthy();
		});

		it('collects all footnotes into single section', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'footnote',
						text: 'First',
					}),
					createCalloutEntry({
						targetLines: [2],
						displayMode: 'footnote',
						text: 'Second',
					}),
					createCalloutEntry({
						targetLines: [3],
						displayMode: 'footnote',
						text: 'Third',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const sections = container.querySelectorAll('.ucf-callout-section');
			expect(sections.length).toBe(1);

			const entries = sections[0].querySelectorAll('.ucf-callout-entry');
			expect(entries.length).toBe(3);
		});
	});

	// =========================================================================
	// POPOVER CALLOUT INJECTION
	// =========================================================================

	describe('Popover callout injection', () => {
		it('injects a trigger element into line content', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'popover',
						text: 'Popover content',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const lineContent = code.querySelector('.ucf-line-content') as HTMLElement;
			const trigger = lineContent.querySelector('.ucf-callout-trigger');
			expect(trigger).toBeTruthy();
			expect(trigger?.getAttribute('data-callout-id')).toBe('1');
		});

		it('appends popover content element to pre', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'popover',
						text: 'Popover message',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const popover = pre.querySelector('.ucf-callout-popover');
			expect(popover).toBeTruthy();
			expect(popover?.getAttribute('data-callout-id')).toBe('1');
			expect(popover?.textContent).toContain('Popover message');
		});

		it('matches trigger and popover by data-callout-id', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'popover',
						text: 'Content 1',
					}),
					createCalloutEntry({
						targetLines: [2],
						displayMode: 'popover',
						text: 'Content 2',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const triggers = pre.querySelectorAll('.ucf-callout-trigger');
			const popovers = pre.querySelectorAll('.ucf-callout-popover');

			expect(triggers.length).toBe(2);
			expect(popovers.length).toBe(2);

			triggers.forEach((trigger, i) => {
				const id = trigger.getAttribute('data-callout-id');
				const matchingPopover = Array.from(popovers).find(
					(p) => p.getAttribute('data-callout-id') === id
				);
				expect(matchingPopover).toBeTruthy();
			});
		});

		it('creates numbered triggers for multiple popovers', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'popover',
						text: 'Pop 1',
					}),
					createCalloutEntry({
						targetLines: [2],
						displayMode: 'popover',
						text: 'Pop 2',
					}),
					createCalloutEntry({
						targetLines: [3],
						displayMode: 'popover',
						text: 'Pop 3',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const popovers = pre.querySelectorAll('.ucf-callout-popover');
			expect(popovers.length).toBe(3);
			expect(popovers[0].getAttribute('data-callout-id')).toBe('1');
			expect(popovers[1].getAttribute('data-callout-id')).toBe('2');
			expect(popovers[2].getAttribute('data-callout-id')).toBe('3');
		});
	});

	// =========================================================================
	// POPOVER INTERACTIONS
	// =========================================================================

	describe('Popover interactions', () => {
		it('clicking trigger shows the popover', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'popover',
						text: 'Content',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const trigger = pre.querySelector('.ucf-callout-trigger') as HTMLElement;
			const popover = pre.querySelector('.ucf-callout-popover') as HTMLElement;

			expect(popover.classList.contains('ucf-popover-visible')).toBe(false);

			trigger.click();

			expect(popover.classList.contains('ucf-popover-visible')).toBe(true);
		});

		it('clicking trigger again hides the popover', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'popover',
						text: 'Content',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const trigger = pre.querySelector('.ucf-callout-trigger') as HTMLElement;
			const popover = pre.querySelector('.ucf-callout-popover') as HTMLElement;

			// Click to show
			trigger.click();
			expect(popover.classList.contains('ucf-popover-visible')).toBe(true);

			// Click to hide
			trigger.click();
			expect(popover.classList.contains('ucf-popover-visible')).toBe(false);
		});

		it('clicking one trigger hides other visible popovers', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'popover',
						text: 'Pop 1',
					}),
					createCalloutEntry({
						targetLines: [2],
						displayMode: 'popover',
						text: 'Pop 2',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const triggers = pre.querySelectorAll('.ucf-callout-trigger') as NodeListOf<HTMLElement>;
			const popovers = pre.querySelectorAll('.ucf-callout-popover') as NodeListOf<HTMLElement>;

			// Show first popover
			triggers[0].click();
			expect(popovers[0].classList.contains('ucf-popover-visible')).toBe(true);

			// Show second popover (should hide first)
			triggers[1].click();
			expect(popovers[0].classList.contains('ucf-popover-visible')).toBe(false);
			expect(popovers[1].classList.contains('ucf-popover-visible')).toBe(true);
		});

		it('clicking elsewhere on pre closes all popovers', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'popover',
						text: 'Pop 1',
					}),
					createCalloutEntry({
						targetLines: [2],
						displayMode: 'popover',
						text: 'Pop 2',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const triggers = pre.querySelectorAll('.ucf-callout-trigger') as NodeListOf<HTMLElement>;
			const popovers = pre.querySelectorAll('.ucf-callout-popover') as NodeListOf<HTMLElement>;

			// Show both popovers
			triggers[0].click();
			triggers[1].click();
			expect(popovers[1].classList.contains('ucf-popover-visible')).toBe(true);

			// Click on pre (outside popover)
			const clickEvent = new MouseEvent('click', { bubbles: true });
			pre.dispatchEvent(clickEvent);

			// All popovers should be hidden
			expect(popovers[0].classList.contains('ucf-popover-visible')).toBe(false);
			expect(popovers[1].classList.contains('ucf-popover-visible')).toBe(false);
		});

		it('trigger click uses stopPropagation to prevent pre handler', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'popover',
						text: 'Content',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const trigger = pre.querySelector('.ucf-callout-trigger') as HTMLElement;
			const popover = pre.querySelector('.ucf-callout-popover') as HTMLElement;

			// Click trigger with stopPropagation should show popover
			const triggerClickEvent = new MouseEvent('click', { bubbles: true });
			trigger.dispatchEvent(triggerClickEvent);

			expect(popover.classList.contains('ucf-popover-visible')).toBe(true);
		});
	});

	// =========================================================================
	// REPLACE FUNCTIONALITY
	// =========================================================================

	describe('Replace functionality', () => {
		it('replaces line content with callout text when replace is true', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						replace: true,
						text: 'Replaced content',
						displayMode: 'inline',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const lineContent = code.querySelector('.ucf-line-content') as HTMLElement;
			expect(lineContent.textContent).toBe('Replaced content');
		});

		it('adds ucf-callout-text class to replaced line', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						replace: true,
						text: 'New text',
						displayMode: 'inline',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const lineContent = code.querySelector('.ucf-line-content') as HTMLElement;
			expect(lineContent.classList.contains('ucf-callout-text')).toBe(true);
		});

		it('joins multiple replace entries with space', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						replace: true,
						text: 'First',
						displayMode: 'inline',
					}),
					createCalloutEntry({
						targetLines: [1],
						replace: true,
						text: 'Second',
						displayMode: 'inline',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const lineContent = code.querySelector('.ucf-line-content') as HTMLElement;
			expect(lineContent.textContent).toBe('First Second');
		});

		it('does not inject non-replace entries when replace is true', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						replace: true,
						text: 'Replaced',
						displayMode: 'footnote',
					}),
					createCalloutEntry({
						targetLines: [1],
						replace: false,
						text: 'Not replaced',
						displayMode: 'footnote',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const lineContent = code.querySelector('.ucf-line-content') as HTMLElement;
			// Only replaced entry should affect line content
			expect(lineContent.textContent).toContain('Replaced');
			// But non-replace footnote should still be injected
			const ref = lineContent.querySelector('.ucf-callout-ref');
			expect(ref).toBeTruthy();
		});

		it('keeps original content when replace is false', () => {
			const originalText = 'original line one';
			code = createMockCodeElement([originalText, 'line two', 'line three']);
			pre.innerHTML = '';
			pre.appendChild(code);

			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						replace: false,
						text: 'Additional note',
						displayMode: 'inline',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const lineContent = code.querySelector('.ucf-line-content') as HTMLElement;
			expect(lineContent.textContent).toBe(originalText);
		});
	});

	// =========================================================================
	// MIXED DISPLAY MODES
	// =========================================================================

	describe('Mixed display modes', () => {
		it('handles inline and footnote together', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'inline',
						text: 'Inline callout',
					}),
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'footnote',
						text: 'Footnote callout',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const calloutInline = code.querySelector('.ucf-callout-inline');
			const ref = code.querySelector('.ucf-callout-ref');
			const section = container.querySelector('.ucf-callout-section');

			expect(calloutInline).toBeTruthy();
			expect(ref).toBeTruthy();
			expect(section).toBeTruthy();
		});

		it('handles inline and popover together', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'inline',
						text: 'Inline callout',
					}),
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'popover',
						text: 'Popover content',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const calloutInline = code.querySelector('.ucf-callout-inline');
			const trigger = code.querySelector('.ucf-callout-trigger');
			const popover = pre.querySelector('.ucf-callout-popover');

			expect(calloutInline).toBeTruthy();
			expect(trigger).toBeTruthy();
			expect(popover).toBeTruthy();
		});

		it('handles footnote and popover together', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'footnote',
						text: 'Footnote callout',
					}),
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'popover',
						text: 'Popover content',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const ref = code.querySelector('.ucf-callout-ref');
			const trigger = code.querySelector('.ucf-callout-trigger');
			const popover = pre.querySelector('.ucf-callout-popover');
			const section = container.querySelector('.ucf-callout-section');

			expect(ref).toBeTruthy();
			expect(trigger).toBeTruthy();
			expect(popover).toBeTruthy();
			expect(section).toBeTruthy();
		});

		it('handles all three modes together', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'inline',
						text: 'Inline',
					}),
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'footnote',
						text: 'Footnote',
					}),
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'popover',
						text: 'Popover',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			expect(code.querySelector('.ucf-callout-inline')).toBeTruthy();
			expect(code.querySelector('.ucf-callout-ref')).toBeTruthy();
			expect(code.querySelector('.ucf-callout-trigger')).toBeTruthy();
			expect(pre.querySelector('.ucf-callout-popover')).toBeTruthy();
			expect(container.querySelector('.ucf-callout-section')).toBeTruthy();
		});
	});

	// =========================================================================
	// CALLOUT TYPES AND STYLING
	// =========================================================================

	describe('Callout types and styling', () => {
		it('uses different types for styling inline callouts', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'inline',
						type: 'warning',
						text: 'Warning text',
					}),
					createCalloutEntry({
						targetLines: [2],
						displayMode: 'inline',
						type: 'info',
						text: 'Info text',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const callouts = code.querySelectorAll('.ucf-callout-inline') as NodeListOf<HTMLElement>;
			expect(callouts.length).toBe(2);

			// Both should have inline styles set (color varies by type)
			callouts.forEach((callout) => {
				expect(callout.style.borderLeftColor).toBeTruthy();
			});
		});

		it('includes callout type in popover styling', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'popover',
						type: 'danger',
						text: 'Danger content',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const popover = pre.querySelector('.ucf-callout-popover') as HTMLElement;
			// Popover should have border-left-color style
			expect(popover.style.borderLeftColor).toBeTruthy();
		});
	});

	// =========================================================================
	// EDGE CASES
	// =========================================================================

	describe('Edge cases', () => {
		it('handles callout on last line', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [3],
						displayMode: 'inline',
						text: 'Last line note',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const callouts = code.querySelectorAll('.ucf-callout-inline');
			expect(callouts.length).toBe(1);

			const lines = code.querySelectorAll('.ucf-line');
			const lastLine = lines[lines.length - 1];
			expect(lastLine.nextSibling?.textContent).toContain('Last line note');
		});

		it('handles callout on non-existent line number (no injection)', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [999],
						displayMode: 'inline',
						text: 'Out of range',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const callouts = code.querySelectorAll('.ucf-callout-inline');
			expect(callouts.length).toBe(0);
		});

		it('handles empty callout text', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'inline',
						text: '',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const callouts = code.querySelectorAll('.ucf-callout-inline');
			expect(callouts.length).toBe(1);
		});

		it('handles special characters in callout text', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'inline',
						text: 'Text with <brackets> & "quotes"',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const callout = code.querySelector('.ucf-callout-inline');
			expect(callout).toBeTruthy();
		});

		it('handles callout entry with multiple target lines', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1, 2, 3],
						displayMode: 'inline',
						text: 'Multi-line callout',
					}),
				],
			});

			injectCallouts(code, pre, container, config);

			const callouts = code.querySelectorAll('.ucf-callout-inline');
			expect(callouts.length).toBe(3);
		});

		it('maintains DOM structure integrity after injection', () => {
			const config = createCalloutConfig({
				entries: [
					createCalloutEntry({
						targetLines: [1],
						displayMode: 'inline',
						text: 'Note',
					}),
				],
			});

			const originalLineCount = code.querySelectorAll('.ucf-line').length;

			injectCallouts(code, pre, container, config);

			// Original lines should be unchanged
			expect(code.querySelectorAll('.ucf-line').length).toBe(originalLineCount);

			// But code should have new children (callouts)
			expect(code.children.length).toBeGreaterThan(originalLineCount);
		});
	});
});
