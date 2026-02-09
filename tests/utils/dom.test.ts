// @vitest-environment jsdom

/**
 * Tests for src/utils/dom.ts
 *
 * Covers: addScrollBehaviour, wrapCodeLinesInDom, processCodeElementLines,
 *         findCodeElement, findPreElement, removeExistingTitleElements,
 *         createCodeBlockContainer, extractCodeText
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupObsidianDom } from '../../src/__mocks__/obsidian';
import {
	addScrollBehaviour,
	wrapCodeLinesInDom,
	processCodeElementLines,
	findCodeElement,
	findPreElement,
	removeExistingTitleElements,
	createCodeBlockContainer,
	extractCodeText,
	type LineWrappingOptions,
} from '../../src/utils/dom';

beforeEach(() => {
	setupObsidianDom();
});

// =============================================================================
// addScrollBehaviour
// =============================================================================

describe('addScrollBehaviour', () => {
	it('adds ucf-scrollable class to pre element', () => {
		const pre = document.createElement('pre');
		addScrollBehaviour(pre, 10);
		expect(pre.classList.contains('ucf-scrollable')).toBe(true);
	});

	it('sets CSS variable --ucf-scroll-height to maxVisibleLines * 1.4', () => {
		const pre = document.createElement('pre');
		addScrollBehaviour(pre, 10);
		expect(pre.style.getPropertyValue('--ucf-scroll-height')).toBe('14em');
	});

	it('correctly calculates scroll height with different line counts', () => {
		const pre = document.createElement('pre');
		addScrollBehaviour(pre, 5);
		expect(pre.style.getPropertyValue('--ucf-scroll-height')).toBe('7em');
	});

	it('creates scroll indicator div with ucf-scroll-indicator class', () => {
		const pre = document.createElement('pre');
		addScrollBehaviour(pre, 10);
		const indicator = pre.querySelector('.ucf-scroll-indicator');
		expect(indicator).not.toBeNull();
		expect(indicator?.tagName).toBe('DIV');
	});

	it('appends scroll indicator to pre element', () => {
		const pre = document.createElement('pre');
		addScrollBehaviour(pre, 10);
		expect(pre.lastChild?.nodeType).toBe(Node.ELEMENT_NODE);
		expect((pre.lastChild as HTMLElement).classList.contains('ucf-scroll-indicator')).toBe(true);
	});

	it('adds scroll event listener to pre element', () => {
		const pre = document.createElement('pre');
		const addEventListenerSpy = vi.spyOn(pre, 'addEventListener');
		addScrollBehaviour(pre, 10);
		expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
	});

	it('toggles ucf-hidden class on indicator when at bottom', () => {
		const pre = document.createElement('pre');
		document.body.appendChild(pre);
		addScrollBehaviour(pre, 10);
		const indicator = pre.querySelector('.ucf-scroll-indicator') as HTMLElement;

		// Simulate at bottom (scrollHeight - scrollTop <= clientHeight + tolerance)
		Object.defineProperty(pre, 'scrollHeight', { value: 100, writable: true });
		Object.defineProperty(pre, 'clientHeight', { value: 100, writable: true });
		Object.defineProperty(pre, 'scrollTop', { value: 0, writable: true });

		const scrollEvent = new Event('scroll');
		pre.dispatchEvent(scrollEvent);

		expect(indicator.classList.contains('ucf-hidden')).toBe(true);

		document.body.removeChild(pre);
	});

	it('removes ucf-hidden class on indicator when not at bottom', () => {
		const pre = document.createElement('pre');
		document.body.appendChild(pre);
		addScrollBehaviour(pre, 10);
		const indicator = pre.querySelector('.ucf-scroll-indicator') as HTMLElement;

		// Simulate not at bottom
		Object.defineProperty(pre, 'scrollHeight', { value: 200, writable: true });
		Object.defineProperty(pre, 'clientHeight', { value: 100, writable: true });
		Object.defineProperty(pre, 'scrollTop', { value: 0, writable: true });

		const scrollEvent = new Event('scroll');
		pre.dispatchEvent(scrollEvent);

		expect(indicator.classList.contains('ucf-hidden')).toBe(false);

		document.body.removeChild(pre);
	});

	it('handles floating point line numbers correctly', () => {
		const pre = document.createElement('pre');
		addScrollBehaviour(pre, 3);
		const value = pre.style.getPropertyValue('--ucf-scroll-height');
		// 3 * 1.4 = 4.2, but may have floating point precision artifacts
		expect(value).toMatch(/^4\.1\d+em$|^4\.2\d*em$/);
	});
});

// =============================================================================
// wrapCodeLinesInDom
// =============================================================================

describe('wrapCodeLinesInDom', () => {
	it('wraps each line in span with ucf-line class', () => {
		const code = document.createElement('code');
		code.textContent = 'line 1\nline 2';
		wrapCodeLinesInDom(code, { showLineNumbers: false, showZebraStripes: false });

		const lines = code.querySelectorAll('.ucf-line');
		expect(lines.length).toBe(2);
	});

	it('adds ucf-line-content span inside each line', () => {
		const code = document.createElement('code');
		code.textContent = 'line 1\nline 2';
		wrapCodeLinesInDom(code, { showLineNumbers: false, showZebraStripes: false });

		const contentSpans = code.querySelectorAll('.ucf-line > .ucf-line-content');
		expect(contentSpans.length).toBe(2);
	});

	it('adds line numbers with ucf-line-num class when showLineNumbers is true', () => {
		const code = document.createElement('code');
		code.textContent = 'line 1\nline 2';
		wrapCodeLinesInDom(code, { showLineNumbers: true, showZebraStripes: false });

		const lineNums = code.querySelectorAll('.ucf-line-num');
		expect(lineNums.length).toBe(2);
		expect((lineNums[0] as HTMLElement).textContent).toBe('1');
		expect((lineNums[1] as HTMLElement).textContent).toBe('2');
	});

	it('does not add line numbers when showLineNumbers is false', () => {
		const code = document.createElement('code');
		code.textContent = 'line 1\nline 2';
		wrapCodeLinesInDom(code, { showLineNumbers: false, showZebraStripes: false });

		const lineNums = code.querySelectorAll('.ucf-line-num');
		expect(lineNums.length).toBe(0);
	});

	it('adds ucf-line-alt class to odd-indexed lines when showZebraStripes is true', () => {
		const code = document.createElement('code');
		code.textContent = 'line 0\nline 1\nline 2\nline 3';
		wrapCodeLinesInDom(code, { showLineNumbers: false, showZebraStripes: true });

		const lines = code.querySelectorAll('.ucf-line');
		expect((lines[0] as HTMLElement).classList.contains('ucf-line-alt')).toBe(false);
		expect((lines[1] as HTMLElement).classList.contains('ucf-line-alt')).toBe(true);
		expect((lines[2] as HTMLElement).classList.contains('ucf-line-alt')).toBe(false);
		expect((lines[3] as HTMLElement).classList.contains('ucf-line-alt')).toBe(true);
	});

	it('does not add ucf-line-alt class when showZebraStripes is false', () => {
		const code = document.createElement('code');
		code.textContent = 'line 0\nline 1\nline 2';
		wrapCodeLinesInDom(code, { showLineNumbers: false, showZebraStripes: false });

		const altLines = code.querySelectorAll('.ucf-line-alt');
		expect(altLines.length).toBe(0);
	});

	it('adds &nbsp; to empty lines', () => {
		const code = document.createElement('code');
		code.textContent = 'line 1\n\nline 3';
		wrapCodeLinesInDom(code, { showLineNumbers: false, showZebraStripes: false });

		const contentSpans = code.querySelectorAll('.ucf-line > .ucf-line-content');
		expect((contentSpans[1] as HTMLElement).innerHTML).toBe('&nbsp;');
	});

	it('removes trailing empty line', () => {
		const code = document.createElement('code');
		code.textContent = 'line 1\nline 2\n';
		wrapCodeLinesInDom(code, { showLineNumbers: false, showZebraStripes: false });

		const lines = code.querySelectorAll('.ucf-line');
		expect(lines.length).toBe(2);
	});

	it('respects startingLineNumber option', () => {
		const code = document.createElement('code');
		code.textContent = 'line 1\nline 2';
		wrapCodeLinesInDom(code, {
			showLineNumbers: true,
			showZebraStripes: false,
			startingLineNumber: 10,
		});

		const lineNums = code.querySelectorAll('.ucf-line-num');
		expect((lineNums[0] as HTMLElement).textContent).toBe('10');
		expect((lineNums[1] as HTMLElement).textContent).toBe('11');
	});

	it('clears code element before wrapping', () => {
		const code = document.createElement('code');
		code.innerHTML = '<span>old content</span>';
		wrapCodeLinesInDom(code, { showLineNumbers: false, showZebraStripes: false });

		// After wrapping, structure should be changed to ucf-line wrapped content
		// The code element's direct children should all be ucf-line elements
		const children = code.children;
		for (let i = 0; i < children.length; i++) {
			expect(children[i].classList.contains('ucf-line')).toBe(true);
		}
	});

	it('preserves syntax highlighting spans across lines', () => {
		const code = document.createElement('code');
		const span = document.createElement('span');
		span.className = 'token-string';
		span.textContent = 'multi\nline\nstring';
		code.appendChild(span);

		wrapCodeLinesInDom(code, { showLineNumbers: false, showZebraStripes: false });

		const lines = code.querySelectorAll('.ucf-line');
		expect(lines.length).toBe(3);

		// Each line should have the highlighted span
		lines.forEach(() => {
			const content = code.querySelector('.ucf-line > .ucf-line-content');
			expect(content?.querySelector('.token-string')).not.toBeNull();
		});
	});

	it('handles single line of code', () => {
		const code = document.createElement('code');
		code.textContent = 'single line';
		wrapCodeLinesInDom(code, { showLineNumbers: false, showZebraStripes: false });

		const lines = code.querySelectorAll('.ucf-line');
		expect(lines.length).toBe(1);
	});

	it('handles empty code element', () => {
		const code = document.createElement('code');
		wrapCodeLinesInDom(code, { showLineNumbers: false, showZebraStripes: false });

		const lines = code.querySelectorAll('.ucf-line');
		expect(lines.length).toBe(0);
	});

	it('combines line numbers and zebra stripes', () => {
		const code = document.createElement('code');
		code.textContent = 'line 1\nline 2\nline 3';
		wrapCodeLinesInDom(code, { showLineNumbers: true, showZebraStripes: true });

		const lines = code.querySelectorAll('.ucf-line');
		expect(lines.length).toBe(3);

		// Check line numbers exist
		expect(code.querySelectorAll('.ucf-line-num').length).toBe(3);

		// Check zebra stripes on odd indices
		expect((lines[1] as HTMLElement).classList.contains('ucf-line-alt')).toBe(true);
	});
});

// =============================================================================
// processCodeElementLines
// =============================================================================

describe('processCodeElementLines', () => {
	it('adds ucf-line-numbers class to pre when showLineNumbers is true', () => {
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		code.textContent = 'line 1';
		pre.appendChild(code);

		processCodeElementLines(pre, code, { showLineNumbers: true, showZebraStripes: false });

		expect(pre.classList.contains('ucf-line-numbers')).toBe(true);
	});

	it('does not add ucf-line-numbers class when showLineNumbers is false', () => {
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		code.textContent = 'line 1';
		pre.appendChild(code);

		processCodeElementLines(pre, code, { showLineNumbers: false, showZebraStripes: false });

		expect(pre.classList.contains('ucf-line-numbers')).toBe(false);
	});

	it('adds ucf-zebra class to pre when showZebraStripes is true', () => {
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		code.textContent = 'line 1';
		pre.appendChild(code);

		processCodeElementLines(pre, code, { showLineNumbers: false, showZebraStripes: true });

		expect(pre.classList.contains('ucf-zebra')).toBe(true);
	});

	it('does not add ucf-zebra class when showZebraStripes is false', () => {
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		code.textContent = 'line 1';
		pre.appendChild(code);

		processCodeElementLines(pre, code, { showLineNumbers: false, showZebraStripes: false });

		expect(pre.classList.contains('ucf-zebra')).toBe(false);
	});

	it('calls wrapCodeLinesInDom when showLineNumbers is true', () => {
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		code.textContent = 'line 1\nline 2';
		pre.appendChild(code);

		processCodeElementLines(pre, code, { showLineNumbers: true, showZebraStripes: false });

		const lines = code.querySelectorAll('.ucf-line');
		expect(lines.length).toBeGreaterThan(0);
	});

	it('calls wrapCodeLinesInDom when showZebraStripes is true', () => {
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		code.textContent = 'line 1\nline 2';
		pre.appendChild(code);

		processCodeElementLines(pre, code, { showLineNumbers: false, showZebraStripes: true });

		const lines = code.querySelectorAll('.ucf-line');
		expect(lines.length).toBeGreaterThan(0);
	});

	it('does not call wrapCodeLinesInDom when both options are false', () => {
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		code.textContent = 'line 1\nline 2';
		pre.appendChild(code);

		processCodeElementLines(pre, code, { showLineNumbers: false, showZebraStripes: false });

		const lines = code.querySelectorAll('.ucf-line');
		expect(lines.length).toBe(0);
	});

	it('adds both classes when both options are true', () => {
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		code.textContent = 'line 1\nline 2';
		pre.appendChild(code);

		processCodeElementLines(pre, code, { showLineNumbers: true, showZebraStripes: true });

		expect(pre.classList.contains('ucf-line-numbers')).toBe(true);
		expect(pre.classList.contains('ucf-zebra')).toBe(true);
	});
});

// =============================================================================
// findCodeElement
// =============================================================================

describe('findCodeElement', () => {
	it('returns code element when present', () => {
		const container = document.createElement('div');
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		pre.appendChild(code);
		container.appendChild(pre);

		const found = findCodeElement(container);
		expect(found).toBe(code);
	});

	it('returns null when code element is not found', () => {
		const container = document.createElement('div');
		const found = findCodeElement(container);
		expect(found).toBeNull();
	});

	it('returns null when pre exists but code does not', () => {
		const container = document.createElement('div');
		const pre = document.createElement('pre');
		container.appendChild(pre);

		const found = findCodeElement(container);
		expect(found).toBeNull();
	});

	it('finds code element nested in pre within container', () => {
		const container = document.createElement('div');
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		const span = document.createElement('span');
		code.appendChild(span);
		pre.appendChild(code);
		container.appendChild(pre);

		const found = findCodeElement(container);
		expect(found).toBe(code);
	});

	it('handles deeply nested containers', () => {
		const container = document.createElement('div');
		const wrapper = document.createElement('div');
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		code.appendChild(document.createTextNode('test'));
		pre.appendChild(code);
		wrapper.appendChild(pre);
		container.appendChild(wrapper);

		const found = findCodeElement(container);
		// querySelector with 'pre > code' selector will find the code even if not direct children of container
		expect(found).toBe(code);
	});
});

// =============================================================================
// findPreElement
// =============================================================================

describe('findPreElement', () => {
	it('returns pre element when code element exists', () => {
		const container = document.createElement('div');
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		pre.appendChild(code);
		container.appendChild(pre);

		const found = findPreElement(container);
		expect(found).toBe(pre);
	});

	it('returns null when code element does not exist', () => {
		const container = document.createElement('div');
		const found = findPreElement(container);
		// Returns undefined (not null) when parentElement is null
		expect(found).toBeFalsy();
	});

	it('finds pre parent of code element', () => {
		const container = document.createElement('div');
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		code.textContent = 'code content';
		pre.appendChild(code);
		container.appendChild(pre);

		const found = findPreElement(container);
		expect(found?.tagName).toBe('PRE');
		expect((found as HTMLElement).querySelector('code')).toBe(code);
	});
});

// =============================================================================
// removeExistingTitleElements
// =============================================================================

describe('removeExistingTitleElements', () => {
	it('removes elements with ucf-title class', () => {
		const container = document.createElement('div');
		const title = document.createElement('div');
		title.className = 'ucf-title';
		container.appendChild(title);

		removeExistingTitleElements(container);

		expect(container.querySelector('.ucf-title')).toBeNull();
	});

	it('removes elements with ucf-description class', () => {
		const container = document.createElement('div');
		const desc = document.createElement('div');
		desc.className = 'ucf-description';
		container.appendChild(desc);

		removeExistingTitleElements(container);

		expect(container.querySelector('.ucf-description')).toBeNull();
	});

	it('removes nested ucf containers except the container itself', () => {
		const container = document.createElement('div');
		container.className = 'ucf';
		const nested = document.createElement('div');
		nested.className = 'ucf';
		container.appendChild(nested);

		removeExistingTitleElements(container);

		expect(container.className).toBe('ucf');
		expect(container.querySelector('.ucf')).toBeNull();
	});

	it('does not remove the container itself', () => {
		const container = document.createElement('div');
		container.className = 'ucf';

		removeExistingTitleElements(container);

		expect(container.className).toBe('ucf');
	});

	it('removes multiple title elements', () => {
		const container = document.createElement('div');
		const title1 = document.createElement('div');
		title1.className = 'ucf-title';
		const title2 = document.createElement('div');
		title2.className = 'ucf-title';
		container.appendChild(title1);
		container.appendChild(title2);

		removeExistingTitleElements(container);

		expect(container.querySelectorAll('.ucf-title').length).toBe(0);
	});

	it('removes multiple description elements', () => {
		const container = document.createElement('div');
		const desc1 = document.createElement('div');
		desc1.className = 'ucf-description';
		const desc2 = document.createElement('div');
		desc2.className = 'ucf-description';
		container.appendChild(desc1);
		container.appendChild(desc2);

		removeExistingTitleElements(container);

		expect(container.querySelectorAll('.ucf-description').length).toBe(0);
	});

	it('cleans all three classes together', () => {
		const container = document.createElement('div');
		container.className = 'ucf';

		const title = document.createElement('div');
		title.className = 'ucf-title';
		const desc = document.createElement('div');
		desc.className = 'ucf-description';
		const nested = document.createElement('div');
		nested.className = 'ucf';

		container.appendChild(title);
		container.appendChild(desc);
		container.appendChild(nested);

		removeExistingTitleElements(container);

		expect(container.querySelector('.ucf-title')).toBeNull();
		expect(container.querySelector('.ucf-description')).toBeNull();
		// querySelectorAll includes the container itself in the result
		expect(container.querySelectorAll('.ucf').length).toBe(0);
	});

	it('preserves other elements in container', () => {
		const container = document.createElement('div');
		const title = document.createElement('div');
		title.className = 'ucf-title';
		const other = document.createElement('div');
		other.className = 'other-class';

		container.appendChild(title);
		container.appendChild(other);

		removeExistingTitleElements(container);

		expect(container.querySelector('.ucf-title')).toBeNull();
		expect(container.querySelector('.other-class')).toBe(other);
	});
});

// =============================================================================
// createCodeBlockContainer
// =============================================================================

describe('createCodeBlockContainer', () => {
	it('creates div with ucf and style class', () => {
		const container = createCodeBlockContainer('tab', true);

		expect(container.tagName).toBe('DIV');
		expect(container.classList.contains('ucf')).toBe(true);
		expect(container.classList.contains('style-tab')).toBe(true);
	});

	it('uses different style classes', () => {
		const tabContainer = createCodeBlockContainer('tab', true);
		const infobartContainer = createCodeBlockContainer('infobar', true);
		const minimalContainer = createCodeBlockContainer('minimal', true);

		expect(tabContainer.classList.contains('style-tab')).toBe(true);
		expect(infobartContainer.classList.contains('style-infobar')).toBe(true);
		expect(minimalContainer.classList.contains('style-minimal')).toBe(true);
	});

	it('adds custom-colors class when useThemeColours is false', () => {
		const container = createCodeBlockContainer('tab', false);
		expect(container.classList.contains('custom-colors')).toBe(true);
	});

	it('does not add custom-colors class when useThemeColours is true', () => {
		const container = createCodeBlockContainer('tab', true);
		expect(container.classList.contains('custom-colors')).toBe(false);
	});

	it('sets --custom-bg CSS variable when custom background is provided', () => {
		const container = createCodeBlockContainer('tab', false, '#ff0000');
		expect(container.style.getPropertyValue('--custom-bg')).toBe('#ff0000');
	});

	it('sets --custom-fg CSS variable when custom text color is provided', () => {
		const container = createCodeBlockContainer('tab', false, undefined, '#00ff00');
		expect(container.style.getPropertyValue('--custom-fg')).toBe('#00ff00');
	});

	it('sets both custom colors when both are provided', () => {
		const container = createCodeBlockContainer('tab', false, '#ff0000', '#00ff00');
		expect(container.style.getPropertyValue('--custom-bg')).toBe('#ff0000');
		expect(container.style.getPropertyValue('--custom-fg')).toBe('#00ff00');
	});

	it('does not set custom colors when useThemeColours is true', () => {
		const container = createCodeBlockContainer('tab', true, '#ff0000', '#00ff00');
		expect(container.style.getPropertyValue('--custom-bg')).toBe('');
		expect(container.style.getPropertyValue('--custom-fg')).toBe('');
	});

	it('handles undefined custom colors gracefully', () => {
		const container = createCodeBlockContainer('tab', false);
		expect(container.style.getPropertyValue('--custom-bg')).toBe('');
		expect(container.style.getPropertyValue('--custom-fg')).toBe('');
	});

	it('handles different color formats', () => {
		const hexContainer = createCodeBlockContainer('tab', false, '#abc123');
		const rgbContainer = createCodeBlockContainer('tab', false, 'rgb(255, 0, 0)');
		const namedContainer = createCodeBlockContainer('tab', false, 'red');

		expect(hexContainer.style.getPropertyValue('--custom-bg')).toBe('#abc123');
		expect(rgbContainer.style.getPropertyValue('--custom-bg')).toBe('rgb(255, 0, 0)');
		expect(namedContainer.style.getPropertyValue('--custom-bg')).toBe('red');
	});
});

// =============================================================================
// extractCodeText
// =============================================================================

describe('extractCodeText', () => {
	it('extracts plain text content from code element', () => {
		const code = document.createElement('code');
		code.textContent = 'const x = 1;';
		const text = extractCodeText(code);
		expect(text).toBe('const x = 1;');
	});

	it('extracts text from code with syntax highlighting spans', () => {
		const code = document.createElement('code');
		const keyword = document.createElement('span');
		keyword.className = 'keyword';
		keyword.textContent = 'const';
		const space = document.createTextNode(' x = 1;');
		code.appendChild(keyword);
		code.appendChild(space);

		const text = extractCodeText(code);
		expect(text).toBe('const x = 1;');
	});

	it('handles empty code element', () => {
		const code = document.createElement('code');
		const text = extractCodeText(code);
		expect(text).toBe('');
	});

	it('handles code with multiline text', () => {
		const code = document.createElement('code');
		code.textContent = 'line 1\nline 2\nline 3';
		const text = extractCodeText(code);
		expect(text).toBe('line 1\nline 2\nline 3');
	});

	it('includes whitespace in extracted text', () => {
		const code = document.createElement('code');
		code.textContent = '  indented\n    more indented';
		const text = extractCodeText(code);
		expect(text).toBe('  indented\n    more indented');
	});

	it('handles deeply nested HTML structure', () => {
		const code = document.createElement('code');
		const span1 = document.createElement('span');
		const span2 = document.createElement('span');
		span2.textContent = 'nested text';
		span1.appendChild(span2);
		code.appendChild(span1);

		const text = extractCodeText(code);
		expect(text).toBe('nested text');
	});

	it('returns empty string instead of null for empty code', () => {
		const code = document.createElement('code');
		const text = extractCodeText(code);
		expect(typeof text).toBe('string');
		expect(text).toBe('');
	});

	it('strips HTML and returns plain text', () => {
		const code = document.createElement('code');
		code.innerHTML = '<span class="keyword">const</span> <span class="variable">x</span>';
		const text = extractCodeText(code);
		expect(text).toBe('const x');
		expect(text).not.toContain('<');
		expect(text).not.toContain('>');
	});
});
