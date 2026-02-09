// @vitest-environment jsdom

/**
 * Tests for src/renderers/code-block.ts
 *
 * Covers:
 * - processCodeBlock (DOM manipulation with options)
 * - countSourceLines (pure function for line counting)
 * - wrapPreElement (DOM manipulation for container wrapping)
 * - createCodeBlockProcessingOptions (pure factory function)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	processCodeBlock,
	countSourceLines,
	wrapPreElement,
	createCodeBlockProcessingOptions,
	type CodeBlockProcessingOptions,
} from '../../src/renderers/code-block';

// Mock the utility functions that are called by processCodeBlock
vi.mock('../../src/utils', () => ({
	addScrollBehaviour: vi.fn(),
	processCodeElementLines: vi.fn(),
	findCodeElement: vi.fn(),
}));

// Import mocked functions for spy verification
import * as utils from '../../src/utils';

describe('processCodeBlock', () => {
	let container: HTMLElement;

	beforeEach(() => {
		// Create a fresh DOM structure for each test
		container = document.createElement('div');
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		code.textContent = 'line1\nline2\nline3';
		pre.appendChild(code);
		container.appendChild(pre);
		document.body.appendChild(container);

		// Reset mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Clean up DOM
		if (container.parentElement) {
			container.parentElement.removeChild(container);
		}
	});

	it('adds ucf-code class to pre element', () => {
		const options: CodeBlockProcessingOptions = {
			showLineNumbers: false,
			showZebraStripes: false,
			scrollLines: 0,
		};

		// Mock findCodeElement to return the code element
		vi.mocked(utils.findCodeElement).mockReturnValue(container.querySelector('code') as HTMLElement);

		processCodeBlock(container, options);

		const preElement = container.querySelector('pre');
		expect(preElement?.classList.contains('ucf-code')).toBe(true);
	});

	it('does not call addScrollBehaviour when scrollLines is 0', () => {
		const options: CodeBlockProcessingOptions = {
			showLineNumbers: false,
			showZebraStripes: false,
			scrollLines: 0,
		};

		vi.mocked(utils.findCodeElement).mockReturnValue(container.querySelector('code') as HTMLElement);

		processCodeBlock(container, options);

		expect(utils.addScrollBehaviour).not.toHaveBeenCalled();
	});

	it('calls addScrollBehaviour when scrollLines > 0', () => {
		const options: CodeBlockProcessingOptions = {
			showLineNumbers: false,
			showZebraStripes: false,
			scrollLines: 10,
		};

		const preElement = container.querySelector('pre') as HTMLPreElement;
		vi.mocked(utils.findCodeElement).mockReturnValue(container.querySelector('code') as HTMLElement);

		processCodeBlock(container, options);

		expect(utils.addScrollBehaviour).toHaveBeenCalledWith(preElement, 10);
	});

	it('calls addScrollBehaviour with correct line count', () => {
		const scrollLines = 5;
		const options: CodeBlockProcessingOptions = {
			showLineNumbers: false,
			showZebraStripes: false,
			scrollLines,
		};

		const preElement = container.querySelector('pre') as HTMLPreElement;
		vi.mocked(utils.findCodeElement).mockReturnValue(container.querySelector('code') as HTMLElement);

		processCodeBlock(container, options);

		expect(utils.addScrollBehaviour).toHaveBeenCalledWith(preElement, scrollLines);
	});

	it('does not call processCodeElementLines when both showLineNumbers and showZebraStripes are false', () => {
		const options: CodeBlockProcessingOptions = {
			showLineNumbers: false,
			showZebraStripes: false,
			scrollLines: 0,
		};

		vi.mocked(utils.findCodeElement).mockReturnValue(container.querySelector('code') as HTMLElement);

		processCodeBlock(container, options);

		expect(utils.processCodeElementLines).not.toHaveBeenCalled();
	});

	it('calls processCodeElementLines when showLineNumbers is true', () => {
		const options: CodeBlockProcessingOptions = {
			showLineNumbers: true,
			showZebraStripes: false,
			scrollLines: 0,
		};

		const codeElement = container.querySelector('code') as HTMLElement;
		const preElement = container.querySelector('pre') as HTMLPreElement;
		vi.mocked(utils.findCodeElement).mockReturnValue(codeElement);

		processCodeBlock(container, options);

		expect(utils.processCodeElementLines).toHaveBeenCalledWith(preElement, codeElement, {
			showLineNumbers: true,
			showZebraStripes: false,
			startingLineNumber: 1,
		});
	});

	it('calls processCodeElementLines when showZebraStripes is true', () => {
		const options: CodeBlockProcessingOptions = {
			showLineNumbers: false,
			showZebraStripes: true,
			scrollLines: 0,
		};

		const codeElement = container.querySelector('code') as HTMLElement;
		const preElement = container.querySelector('pre') as HTMLPreElement;
		vi.mocked(utils.findCodeElement).mockReturnValue(codeElement);

		processCodeBlock(container, options);

		expect(utils.processCodeElementLines).toHaveBeenCalledWith(preElement, codeElement, {
			showLineNumbers: false,
			showZebraStripes: true,
			startingLineNumber: 1,
		});
	});

	it('calls processCodeElementLines when both showLineNumbers and showZebraStripes are true', () => {
		const options: CodeBlockProcessingOptions = {
			showLineNumbers: true,
			showZebraStripes: true,
			scrollLines: 0,
		};

		const codeElement = container.querySelector('code') as HTMLElement;
		const preElement = container.querySelector('pre') as HTMLPreElement;
		vi.mocked(utils.findCodeElement).mockReturnValue(codeElement);

		processCodeBlock(container, options);

		expect(utils.processCodeElementLines).toHaveBeenCalledWith(preElement, codeElement, {
			showLineNumbers: true,
			showZebraStripes: true,
			startingLineNumber: 1,
		});
	});

	it('uses default startingLineNumber of 1 when not specified', () => {
		const options: CodeBlockProcessingOptions = {
			showLineNumbers: true,
			showZebraStripes: false,
			scrollLines: 0,
		};

		const codeElement = container.querySelector('code') as HTMLElement;
		const preElement = container.querySelector('pre') as HTMLPreElement;
		vi.mocked(utils.findCodeElement).mockReturnValue(codeElement);

		processCodeBlock(container, options);

		expect(utils.processCodeElementLines).toHaveBeenCalledWith(
			preElement,
			codeElement,
			expect.objectContaining({
				startingLineNumber: 1,
			})
		);
	});

	it('returns early if code element is not found', () => {
		const options: CodeBlockProcessingOptions = {
			showLineNumbers: true,
			showZebraStripes: true,
			scrollLines: 5,
		};

		// Mock findCodeElement to return null
		vi.mocked(utils.findCodeElement).mockReturnValue(null);

		processCodeBlock(container, options);

		expect(utils.addScrollBehaviour).not.toHaveBeenCalled();
		expect(utils.processCodeElementLines).not.toHaveBeenCalled();
	});

	it('applies all features together: scroll, line numbers, and zebra stripes', () => {
		const options: CodeBlockProcessingOptions = {
			showLineNumbers: true,
			showZebraStripes: true,
			scrollLines: 8,
		};

		const codeElement = container.querySelector('code') as HTMLElement;
		const preElement = container.querySelector('pre') as HTMLPreElement;
		vi.mocked(utils.findCodeElement).mockReturnValue(codeElement);

		processCodeBlock(container, options);

		// Verify all features are enabled
		expect(preElement.classList.contains('ucf-code')).toBe(true);
		expect(utils.addScrollBehaviour).toHaveBeenCalledWith(preElement, 8);
		expect(utils.processCodeElementLines).toHaveBeenCalledWith(
			preElement,
			codeElement,
			expect.objectContaining({
				showLineNumbers: true,
				showZebraStripes: true,
			})
		);
	});
});

describe('countSourceLines', () => {
	it('returns 0 for empty string', () => {
		expect(countSourceLines('')).toBe(0);
	});

	it('returns 0 for null/falsy input', () => {
		expect(countSourceLines(null as any)).toBe(0);
		expect(countSourceLines(undefined as any)).toBe(0);
	});

	it('returns 1 for single line without newline', () => {
		expect(countSourceLines('hello world')).toBe(1);
	});

	it('returns 2 for two lines separated by newline', () => {
		expect(countSourceLines('line1\nline2')).toBe(2);
	});

	it('returns 3 for three lines', () => {
		expect(countSourceLines('line1\nline2\nline3')).toBe(3);
	});

	it('returns correct count with trailing newline', () => {
		expect(countSourceLines('line1\nline2\n')).toBe(3);
	});

	it('returns correct count with multiple trailing newlines', () => {
		expect(countSourceLines('line1\nline2\n\n\n')).toBe(5);
	});

	it('counts empty lines between content', () => {
		expect(countSourceLines('line1\n\nline3')).toBe(3);
	});

	it('works with windows-style line endings mixed', () => {
		// Note: split('\n') will leave \r at end of lines, but count is correct
		expect(countSourceLines('line1\r\nline2\r\nline3')).toBe(3);
	});

	it('counts only newline characters', () => {
		// "abc" has no newlines, so 1 line
		expect(countSourceLines('abc')).toBe(1);
	});

	it('handles very long strings with many lines', () => {
		const lines = Array(1000).fill('line').join('\n');
		expect(countSourceLines(lines)).toBe(1000);
	});

	it('handles strings with only newlines', () => {
		expect(countSourceLines('\n\n\n')).toBe(4);
	});
});

describe('wrapPreElement', () => {
	let container: HTMLElement;
	let parent: HTMLElement;
	let pre: HTMLPreElement;
	let code: HTMLElement;

	beforeEach(() => {
		// Create a realistic DOM structure
		parent = document.createElement('div');
		pre = document.createElement('pre');
		code = document.createElement('code');
		code.textContent = 'some code';
		pre.appendChild(code);
		parent.appendChild(pre);
		document.body.appendChild(parent);

		// Create wrapper container
		container = document.createElement('div');
	});

	afterEach(() => {
		if (parent.parentElement) {
			parent.parentElement.removeChild(parent);
		}
	});

	it('inserts container before pre in parent', () => {
		wrapPreElement(pre, container);

		expect(parent.childNodes[0]).toBe(container);
	});

	it('moves pre inside container', () => {
		wrapPreElement(pre, container);

		expect(container.contains(pre)).toBe(true);
		expect(container.childNodes[0]).toBe(pre);
	});

	it('adds ucf-code class to pre element', () => {
		wrapPreElement(pre, container);

		expect(pre.classList.contains('ucf-code')).toBe(true);
	});

	it('preserves pre element content', () => {
		const originalContent = pre.innerHTML;

		wrapPreElement(pre, container);

		expect(pre.innerHTML).toBe(originalContent);
	});

	it('maintains proper DOM hierarchy after wrapping', () => {
		wrapPreElement(pre, container);

		expect(parent.contains(container)).toBe(true);
		expect(container.contains(pre)).toBe(true);
		expect(pre.contains(code)).toBe(true);
	});

	it('works with multiple siblings after pre', () => {
		const sibling = document.createElement('div');
		parent.appendChild(sibling);

		wrapPreElement(pre, container);

		expect(parent.childNodes[0]).toBe(container);
		expect(parent.childNodes[1]).toBe(sibling);
	});

	it('works with multiple siblings before pre', () => {
		const siblingBefore = document.createElement('div');
		parent.insertBefore(siblingBefore, pre);

		wrapPreElement(pre, container);

		expect(parent.childNodes[0]).toBe(siblingBefore);
		expect(parent.childNodes[1]).toBe(container);
	});

	it('allows container to have additional content before pre', () => {
		const child = document.createElement('div');
		container.appendChild(child);

		wrapPreElement(pre, container);

		expect(container.childNodes[0]).toBe(child);
		expect(container.childNodes[1]).toBe(pre);
	});

	it('works when pre has no parent initially but is added before calling wrap', () => {
		const newPre = document.createElement('pre');
		const newCode = document.createElement('code');
		newCode.textContent = 'code';
		newPre.appendChild(newCode);
		parent.appendChild(newPre);

		const newContainer = document.createElement('div');
		wrapPreElement(newPre, newContainer);

		expect(parent.contains(newContainer)).toBe(true);
		expect(newContainer.contains(newPre)).toBe(true);
	});
});

describe('createCodeBlockProcessingOptions', () => {
	it('creates options with all parameters', () => {
		const options = createCodeBlockProcessingOptions(true, true, 10);

		expect(options).toEqual({
			showLineNumbers: true,
			showZebraStripes: true,
			startingLineNumber: 1,
			scrollLines: 10,
		});
	});

	it('sets startingLineNumber to 1 by default', () => {
		const options = createCodeBlockProcessingOptions(false, false, 0);

		expect(options.startingLineNumber).toBe(1);
	});

	it('preserves showLineNumbers when true', () => {
		const options = createCodeBlockProcessingOptions(true, false, 0);

		expect(options.showLineNumbers).toBe(true);
	});

	it('preserves showLineNumbers when false', () => {
		const options = createCodeBlockProcessingOptions(false, true, 0);

		expect(options.showLineNumbers).toBe(false);
	});

	it('preserves showZebraStripes when true', () => {
		const options = createCodeBlockProcessingOptions(false, true, 0);

		expect(options.showZebraStripes).toBe(true);
	});

	it('preserves showZebraStripes when false', () => {
		const options = createCodeBlockProcessingOptions(true, false, 0);

		expect(options.showZebraStripes).toBe(false);
	});

	it('preserves scrollLines value of 0', () => {
		const options = createCodeBlockProcessingOptions(false, false, 0);

		expect(options.scrollLines).toBe(0);
	});

	it('preserves scrollLines with positive values', () => {
		const options = createCodeBlockProcessingOptions(false, false, 15);

		expect(options.scrollLines).toBe(15);
	});

	it('returns independent options objects each time', () => {
		const options1 = createCodeBlockProcessingOptions(true, false, 5);
		const options2 = createCodeBlockProcessingOptions(true, false, 5);

		expect(options1).not.toBe(options2);
		expect(options1).toEqual(options2);
	});

	it('creates options matching CodeBlockProcessingOptions interface', () => {
		const options = createCodeBlockProcessingOptions(true, true, 20);

		// Verify all interface properties are present
		expect(options).toHaveProperty('showLineNumbers');
		expect(options).toHaveProperty('showZebraStripes');
		expect(options).toHaveProperty('startingLineNumber');
		expect(options).toHaveProperty('scrollLines');
	});

	it('works with all combinations of boolean flags', () => {
		const combinations = [
			[true, true],
			[true, false],
			[false, true],
			[false, false],
		];

		combinations.forEach(([lines, zebra]) => {
			const options = createCodeBlockProcessingOptions(lines as boolean, zebra as boolean, 10);
			expect(options.showLineNumbers).toBe(lines);
			expect(options.showZebraStripes).toBe(zebra);
		});
	});

	it('works with edge case scrollLines values', () => {
		expect(createCodeBlockProcessingOptions(false, false, 0).scrollLines).toBe(0);
		expect(createCodeBlockProcessingOptions(false, false, 1).scrollLines).toBe(1);
		expect(createCodeBlockProcessingOptions(false, false, 100).scrollLines).toBe(100);
		expect(createCodeBlockProcessingOptions(false, false, 999999).scrollLines).toBe(999999);
	});
});

// Helper for afterEach in processCodeBlock describe block
function afterEach(fn: () => void): void;
function afterEach(name: string, fn: () => void): void;
function afterEach(name: string | (() => void), fn?: () => void): void {
	if (typeof name === 'function') {
		// @ts-ignore - vitest supports afterEach without explicit typing
		globalThis.afterEach(name);
	} else {
		// @ts-ignore - vitest supports afterEach with name and function
		globalThis.afterEach(name, fn);
	}
}
