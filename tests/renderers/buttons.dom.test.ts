// @vitest-environment jsdom

/**
 * Tests for src/renderers/buttons.ts - DOM Functions
 *
 * Tests: addCopyButton, addDownloadButton, addFoldButton, addCodeBlockButtons
 * These tests verify DOM manipulation, event handling, and button state management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Platform } from 'obsidian';
import {
	addCopyButton,
	addDownloadButton,
	addFoldButton,
	addCodeBlockButtons,
} from '../../src/renderers/buttons';
import { CSS_CLASSES, COPY_SUCCESS_DURATION_MS } from '../../src/constants';

// Mock navigator.clipboard
Object.assign(navigator, {
	clipboard: {
		writeText: vi.fn(() => Promise.resolve()),
	},
});

describe('addCopyButton', () => {
	let preElement: HTMLPreElement;
	let codeElement: HTMLCodeElement;

	beforeEach(() => {
		// Create DOM structure
		preElement = document.createElement('pre');
		codeElement = document.createElement('code');
		codeElement.textContent = 'test code';
		preElement.appendChild(codeElement);
		document.body.appendChild(preElement);

		// Reset mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('creates a button with correct class and aria-label', () => {
		addCopyButton(preElement);

		const button = preElement.querySelector(`.${CSS_CLASSES.copyButton}`);
		expect(button).toBeDefined();
		expect(button?.getAttribute('aria-label')).toBe('Copy code');
	});

	it('adds SVG icon to the button', () => {
		addCopyButton(preElement);

		const button = preElement.querySelector(`.${CSS_CLASSES.copyButton}`);
		const svg = button?.querySelector('svg');
		expect(svg).toBeDefined();
	});

	it('appends button to preElement', () => {
		addCopyButton(preElement);

		const button = preElement.querySelector(`.${CSS_CLASSES.copyButton}`);
		expect(button?.parentElement).toBe(preElement);
	});

	it('includes shift copy tooltip when shiftCopyJoin is set', () => {
		addCopyButton(preElement, { shiftCopyJoin: '&&' });

		const button = preElement.querySelector(`.${CSS_CLASSES.copyButton}`);
		const title = button?.getAttribute('title');
		expect(title).toContain('⇧: Join lines with &&');
	});

	it('includes alt copy tooltip when altCopyJoin is set', () => {
		addCopyButton(preElement, { altCopyJoin: ';' });

		const button = preElement.querySelector(`.${CSS_CLASSES.copyButton}`);
		const title = button?.getAttribute('title');
		expect(title).toContain('Alt: Join lines with ;');
	});

	it('shows correct modifier key for macOS', () => {
		(Platform as any).isMacOS = true;

		addCopyButton(preElement, { altCopyJoin: ';' });

		const button = preElement.querySelector(`.${CSS_CLASSES.copyButton}`);
		const title = button?.getAttribute('title');
		expect(title).toContain('⌘: Join lines with ;');

		(Platform as any).isMacOS = false;
	});

	it('shows correct modifier key for iOS', () => {
		(Platform as any).isIosApp = true;

		addCopyButton(preElement, { altCopyJoin: ';' });

		const button = preElement.querySelector(`.${CSS_CLASSES.copyButton}`);
		const title = button?.getAttribute('title');
		expect(title).toContain('⌘: Join lines with ;');

		(Platform as any).isIosApp = false;
	});

	it('combines shift and alt tooltips', () => {
		addCopyButton(preElement, { shiftCopyJoin: '&&', altCopyJoin: ';' });

		const button = preElement.querySelector(`.${CSS_CLASSES.copyButton}`);
		const title = button?.getAttribute('title');
		expect(title).toContain('⇧: Join lines with &&');
		expect(title).toContain('Alt: Join lines with ;');
	});

	it('copies plain code text on click', async () => {
		addCopyButton(preElement);

		const button = preElement.querySelector(
			`.${CSS_CLASSES.copyButton}`
		) as HTMLButtonElement;
		button.click();

		// Wait for clipboard promise
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test code');
	});

	it('adds copied class after successful copy', async () => {
		addCopyButton(preElement);

		const button = preElement.querySelector(
			`.${CSS_CLASSES.copyButton}`
		) as HTMLButtonElement;
		button.click();

		await new Promise(resolve => setTimeout(resolve, 10));

		expect(button.classList.contains(CSS_CLASSES.copied)).toBe(true);
	});

	it('changes to checkmark icon after copy', async () => {
		addCopyButton(preElement);

		const button = preElement.querySelector(
			`.${CSS_CLASSES.copyButton}`
		) as HTMLButtonElement;
		const originalHTML = button.innerHTML;

		button.click();
		await new Promise(resolve => setTimeout(resolve, 10));

		const newHTML = button.innerHTML;
		expect(newHTML).not.toBe(originalHTML);
		expect(newHTML).toContain('polyline'); // checkmark has different SVG content
	});

	it('removes copied class after timeout', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		addCopyButton(preElement);

		const button = preElement.querySelector(
			`.${CSS_CLASSES.copyButton}`
		) as HTMLButtonElement;
		button.click();

		await vi.waitFor(() => button.classList.contains(CSS_CLASSES.copied));

		expect(button.classList.contains(CSS_CLASSES.copied)).toBe(true);

		// Fast-forward time
		vi.advanceTimersByTime(COPY_SUCCESS_DURATION_MS);

		expect(button.classList.contains(CSS_CLASSES.copied)).toBe(false);

		vi.useRealTimers();
	});

	it('restores original icon after timeout', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		addCopyButton(preElement);

		const button = preElement.querySelector(
			`.${CSS_CLASSES.copyButton}`
		) as HTMLButtonElement;
		const originalHTML = button.innerHTML;

		button.click();
		await vi.waitFor(() => button.classList.contains(CSS_CLASSES.copied));

		vi.advanceTimersByTime(COPY_SUCCESS_DURATION_MS);

		expect(button.innerHTML).toBe(originalHTML);

		vi.useRealTimers();
	});

	it('handles click event asynchronously', async () => {
		addCopyButton(preElement);

		const button = preElement.querySelector(
			`.${CSS_CLASSES.copyButton}`
		) as HTMLButtonElement;

		button.click();

		await new Promise(resolve => setTimeout(resolve, 10));

		// Verify the click handler was called by checking clipboard interaction
		expect(navigator.clipboard.writeText).toHaveBeenCalled();
	});

	it('joins lines with shift operator on shift+click', async () => {
		codeElement.textContent = 'line1\nline2\nline3';
		addCopyButton(preElement, { shiftCopyJoin: '&&' });

		const button = preElement.querySelector(
			`.${CSS_CLASSES.copyButton}`
		) as HTMLButtonElement;

		const event = new MouseEvent('click', { bubbles: true, shiftKey: true } as MouseEventInit);
		button.dispatchEvent(event);

		await new Promise(resolve => setTimeout(resolve, 10));

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith('line1 && line2 && line3');
	});

	it('joins lines with alt operator on alt+click', async () => {
		codeElement.textContent = 'cmd1\ncmd2\ncmd3';
		addCopyButton(preElement, { altCopyJoin: ';' });

		const button = preElement.querySelector(
			`.${CSS_CLASSES.copyButton}`
		) as HTMLButtonElement;

		const event = new MouseEvent('click', { bubbles: true, altKey: true } as MouseEventInit);
		button.dispatchEvent(event);

		await new Promise(resolve => setTimeout(resolve, 10));

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith('cmd1 ; cmd2 ; cmd3');
	});

	it('joins lines with meta operator on meta+click (for Mac compatibility)', async () => {
		codeElement.textContent = 'cmd1\ncmd2';
		addCopyButton(preElement, { altCopyJoin: ';' });

		const button = preElement.querySelector(
			`.${CSS_CLASSES.copyButton}`
		) as HTMLButtonElement;

		const event = new MouseEvent('click', { bubbles: true, metaKey: true } as MouseEventInit);
		button.dispatchEvent(event);

		await new Promise(resolve => setTimeout(resolve, 10));

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith('cmd1 ; cmd2');
	});

	it('filters lines with joinIgnoreRegex', async () => {
		codeElement.textContent = 'line1\n# comment\nline2';
		addCopyButton(preElement, {
			shiftCopyJoin: '&&',
			joinIgnoreRegex: '^#',
		});

		const button = preElement.querySelector(
			`.${CSS_CLASSES.copyButton}`
		) as HTMLButtonElement;

		const event = new MouseEvent('click', { bubbles: true, shiftKey: true } as MouseEventInit);
		button.dispatchEvent(event);

		await new Promise(resolve => setTimeout(resolve, 10));

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith('line1 && line2');
	});
});

describe('addDownloadButton', () => {
	let preElement: HTMLPreElement;
	let codeElement: HTMLCodeElement;
	let onDownloadMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		preElement = document.createElement('pre');
		codeElement = document.createElement('code');
		codeElement.textContent = 'downloadable code';
		preElement.appendChild(codeElement);
		document.body.appendChild(preElement);

		onDownloadMock = vi.fn(() => Promise.resolve());
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.clearAllMocks();
	});

	it('creates a button with correct class', () => {
		addDownloadButton(preElement, onDownloadMock);

		const button = preElement.querySelector(`.${CSS_CLASSES.downloadButton}`);
		expect(button).toBeDefined();
	});

	it('sets aria-label correctly', () => {
		addDownloadButton(preElement, onDownloadMock);

		const button = preElement.querySelector(`.${CSS_CLASSES.downloadButton}`);
		expect(button?.getAttribute('aria-label')).toBe('Download code');
	});

	it('sets title attribute', () => {
		addDownloadButton(preElement, onDownloadMock);

		const button = preElement.querySelector(`.${CSS_CLASSES.downloadButton}`);
		expect(button?.getAttribute('title')).toBe('Save to file');
	});

	it('includes SVG download icon', () => {
		addDownloadButton(preElement, onDownloadMock);

		const button = preElement.querySelector(`.${CSS_CLASSES.downloadButton}`);
		const svg = button?.querySelector('svg');
		expect(svg).toBeDefined();
	});

	it('appends button to preElement', () => {
		addDownloadButton(preElement, onDownloadMock);

		const button = preElement.querySelector(`.${CSS_CLASSES.downloadButton}`);
		expect(button?.parentElement).toBe(preElement);
	});

	it('calls onDownload callback with code text on click', async () => {
		addDownloadButton(preElement, onDownloadMock);

		const button = preElement.querySelector(
			`.${CSS_CLASSES.downloadButton}`
		) as HTMLButtonElement;
		button.click();

		await new Promise(resolve => setTimeout(resolve, 0));

		expect(onDownloadMock).toHaveBeenCalledWith('downloadable code');
	});

	it('handles click event asynchronously', async () => {
		addDownloadButton(preElement, onDownloadMock);

		const button = preElement.querySelector(
			`.${CSS_CLASSES.downloadButton}`
		) as HTMLButtonElement;

		button.click();

		await new Promise(resolve => setTimeout(resolve, 10));

		// Verify the click handler was called by checking the callback
		expect(onDownloadMock).toHaveBeenCalled();
	});
});

describe('addFoldButton', () => {
	let preElement: HTMLPreElement;
	let codeElement: HTMLCodeElement;

	beforeEach(() => {
		preElement = document.createElement('pre');
		codeElement = document.createElement('code');
		preElement.appendChild(codeElement);
		document.body.appendChild(preElement);

		// Mock getComputedStyle to return predictable line height
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			lineHeight: '20px',
		} as CSSStyleDeclaration);
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.clearAllMocks();
	});

	it('adds folded class to pre element', () => {
		addFoldButton(preElement, 100, 10);

		expect(preElement.classList.contains(CSS_CLASSES.folded)).toBe(true);
	});

	it('sets CSS custom property for folded height', () => {
		addFoldButton(preElement, 100, 10);

		const cssValue = preElement.style.getPropertyValue('--ucf-folded-height');
		expect(cssValue).toBe('216px'); // (10 * 20) + 16 padding
	});

	it('creates fold bar container with correct class', () => {
		addFoldButton(preElement, 100, 10);

		const foldBar = preElement.querySelector(`.${CSS_CLASSES.foldBar}`);
		expect(foldBar).toBeDefined();
	});

	it('appends fold bar to preElement', () => {
		addFoldButton(preElement, 100, 10);

		const foldBar = preElement.querySelector(`.${CSS_CLASSES.foldBar}`);
		expect(foldBar?.parentElement).toBe(preElement);
	});

	it('creates fold button with correct class', () => {
		addFoldButton(preElement, 100, 10);

		const foldButton = preElement.querySelector(`.${CSS_CLASSES.foldButton}`);
		expect(foldButton).toBeDefined();
	});

	it('displays correct hidden line count in button text', () => {
		addFoldButton(preElement, 100, 10);

		const foldButton = preElement.querySelector(`.${CSS_CLASSES.foldButton}`);
		expect(foldButton?.innerHTML).toContain('Show more (90 more lines)');
	});

	it('includes chevron down icon in initial state', () => {
		addFoldButton(preElement, 100, 10);

		const foldButton = preElement.querySelector(`.${CSS_CLASSES.foldButton}`);
		const svg = foldButton?.querySelector('svg');
		expect(svg).toBeDefined();
	});

	it('toggles folded class on click', () => {
		addFoldButton(preElement, 100, 10);

		const foldButton = preElement.querySelector(
			`.${CSS_CLASSES.foldButton}`
		) as HTMLButtonElement;

		expect(preElement.classList.contains(CSS_CLASSES.folded)).toBe(true);

		foldButton.click();
		expect(preElement.classList.contains(CSS_CLASSES.folded)).toBe(false);

		foldButton.click();
		expect(preElement.classList.contains(CSS_CLASSES.folded)).toBe(true);
	});

	it('changes button text to "Show less" when unfolded', () => {
		addFoldButton(preElement, 100, 10);

		const foldButton = preElement.querySelector(
			`.${CSS_CLASSES.foldButton}`
		) as HTMLButtonElement;

		foldButton.click();

		expect(foldButton.innerHTML).toContain('Show less');
	});

	it('changes button text back to "Show more" when folded again', () => {
		addFoldButton(preElement, 100, 10);

		const foldButton = preElement.querySelector(
			`.${CSS_CLASSES.foldButton}`
		) as HTMLButtonElement;

		foldButton.click();
		foldButton.click();

		expect(foldButton.innerHTML).toContain('Show more (90 more lines)');
	});

	it('handles click event and updates state', () => {
		addFoldButton(preElement, 100, 10);

		const foldButton = preElement.querySelector(
			`.${CSS_CLASSES.foldButton}`
		) as HTMLButtonElement;

		// Initial state
		expect(preElement.classList.contains(CSS_CLASSES.folded)).toBe(true);

		// Click should toggle
		foldButton.click();

		expect(preElement.classList.contains(CSS_CLASSES.folded)).toBe(false);
	});

	it('returns early if code element is not found', () => {
		const emptyPre = document.createElement('pre');
		document.body.appendChild(emptyPre);

		addFoldButton(emptyPre, 100, 10);

		const foldBar = emptyPre.querySelector(`.${CSS_CLASSES.foldBar}`);
		expect(foldBar).toBeNull();
	});

	it('handles large fold counts correctly', () => {
		addFoldButton(preElement, 10000, 50);

		const foldButton = preElement.querySelector(`.${CSS_CLASSES.foldButton}`);
		expect(foldButton?.innerHTML).toContain('Show more (9950 more lines)');
	});
});

describe('addCodeBlockButtons', () => {
	let preElement: HTMLPreElement;
	let codeElement: HTMLCodeElement;
	let onDownloadMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		preElement = document.createElement('pre');
		codeElement = document.createElement('code');
		codeElement.textContent = 'test code content';
		preElement.appendChild(codeElement);
		document.body.appendChild(preElement);

		onDownloadMock = vi.fn(() => Promise.resolve());

		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			lineHeight: '20px',
		} as CSSStyleDeclaration);
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.clearAllMocks();
	});

	it('adds copy button when showCopyButton is true', () => {
		addCodeBlockButtons(preElement, {
			showCopyButton: true,
			showDownloadButton: false,
			totalLineCount: 5,
			foldLines: 0,
		});

		expect(preElement.querySelector(`.${CSS_CLASSES.copyButton}`)).toBeDefined();
	});

	it('does not add copy button when showCopyButton is false', () => {
		addCodeBlockButtons(preElement, {
			showCopyButton: false,
			showDownloadButton: false,
			totalLineCount: 5,
			foldLines: 0,
		});

		expect(preElement.querySelector(`.${CSS_CLASSES.copyButton}`)).toBeNull();
	});

	it('adds download button when showDownloadButton is true and onDownload provided', () => {
		addCodeBlockButtons(preElement, {
			showCopyButton: false,
			showDownloadButton: true,
			totalLineCount: 5,
			foldLines: 0,
			onDownload: onDownloadMock,
		});

		expect(preElement.querySelector(`.${CSS_CLASSES.downloadButton}`)).toBeDefined();
	});

	it('does not add download button when showDownloadButton is false', () => {
		addCodeBlockButtons(preElement, {
			showCopyButton: false,
			showDownloadButton: false,
			totalLineCount: 5,
			foldLines: 0,
			onDownload: onDownloadMock,
		});

		expect(preElement.querySelector(`.${CSS_CLASSES.downloadButton}`)).toBeNull();
	});

	it('does not add download button when onDownload is not provided', () => {
		addCodeBlockButtons(preElement, {
			showCopyButton: false,
			showDownloadButton: true,
			totalLineCount: 5,
			foldLines: 0,
		});

		expect(preElement.querySelector(`.${CSS_CLASSES.downloadButton}`)).toBeNull();
	});

	it('adds fold button when foldLines > 0 and totalLineCount > foldLines', () => {
		addCodeBlockButtons(preElement, {
			showCopyButton: false,
			showDownloadButton: false,
			totalLineCount: 100,
			foldLines: 10,
		});

		expect(preElement.querySelector(`.${CSS_CLASSES.foldBar}`)).toBeDefined();
	});

	it('does not add fold button when foldLines is 0', () => {
		addCodeBlockButtons(preElement, {
			showCopyButton: false,
			showDownloadButton: false,
			totalLineCount: 100,
			foldLines: 0,
		});

		expect(preElement.querySelector(`.${CSS_CLASSES.foldBar}`)).toBeNull();
	});

	it('does not add fold button when totalLineCount <= foldLines', () => {
		addCodeBlockButtons(preElement, {
			showCopyButton: false,
			showDownloadButton: false,
			totalLineCount: 10,
			foldLines: 20,
		});

		expect(preElement.querySelector(`.${CSS_CLASSES.foldBar}`)).toBeNull();
	});

	it('adds all three buttons when all options are enabled', () => {
		addCodeBlockButtons(preElement, {
			showCopyButton: true,
			showDownloadButton: true,
			totalLineCount: 100,
			foldLines: 10,
			onDownload: onDownloadMock,
		});

		expect(preElement.querySelector(`.${CSS_CLASSES.copyButton}`)).toBeDefined();
		expect(preElement.querySelector(`.${CSS_CLASSES.downloadButton}`)).toBeDefined();
		expect(preElement.querySelector(`.${CSS_CLASSES.foldBar}`)).toBeDefined();
	});

	it('passes copy options to addCopyButton', async () => {
		addCodeBlockButtons(preElement, {
			showCopyButton: true,
			showDownloadButton: false,
			totalLineCount: 5,
			foldLines: 0,
			shiftCopyJoin: '&&',
			altCopyJoin: ';',
		});

		const button = preElement.querySelector(`.${CSS_CLASSES.copyButton}`);
		const title = button?.getAttribute('title');

		expect(title).toContain('⇧: Join lines with &&');
		expect(title).toContain('Alt: Join lines with ;');
	});

	it('passes download callback to addDownloadButton', async () => {
		addCodeBlockButtons(preElement, {
			showCopyButton: false,
			showDownloadButton: true,
			totalLineCount: 5,
			foldLines: 0,
			onDownload: onDownloadMock,
		});

		const button = preElement.querySelector(
			`.${CSS_CLASSES.downloadButton}`
		) as HTMLButtonElement;
		button.click();

		await new Promise(resolve => setTimeout(resolve, 10));

		expect(onDownloadMock).toHaveBeenCalledWith('test code content');
	});

	it('handles joinIgnoreRegex option', async () => {
		codeElement.textContent = 'line1\n# ignore this\nline2';

		vi.mocked(navigator.clipboard.writeText).mockClear();

		addCodeBlockButtons(preElement, {
			showCopyButton: true,
			showDownloadButton: false,
			totalLineCount: 3,
			foldLines: 0,
			shiftCopyJoin: '&&',
			joinIgnoreRegex: '^#',
		});

		const button = preElement.querySelector(
			`.${CSS_CLASSES.copyButton}`
		) as HTMLButtonElement;

		const event = new MouseEvent('click', { bubbles: true, shiftKey: true } as MouseEventInit);
		button.dispatchEvent(event);

		await new Promise(resolve => setTimeout(resolve, 10));

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith('line1 && line2');
	});
});
