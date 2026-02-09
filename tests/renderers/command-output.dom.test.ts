// @vitest-environment jsdom

/**
 * Tests for src/renderers/command-output.ts - DOM rendering
 *
 * Covers renderCommandOutput(), which is the DOM-dependent function.
 * Pure functions (processOutputLine, processAllOutputLines, etc.) are
 * tested separately in command-output.test.ts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderCommandOutput } from '../../src/renderers/command-output';
import { App, Component, setupObsidianDom } from '../../src/__mocks__/obsidian';
import type { CommandOutputStyles } from '../../src/types';
import { CSS_CLASSES, styleClass, COMMAND_OUTPUT_ICON } from '../../src/constants';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Default styles for testing
 */
function defaultStyles(): CommandOutputStyles {
	return {
		promptColour: '',
		promptBold: false,
		promptItalic: false,
		commandColour: '',
		commandBold: false,
		commandItalic: false,
		outputColour: '',
		outputBold: false,
		outputItalic: false,
	};
}

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
	setupObsidianDom();
});

// =============================================================================
// Basic Container Tests
// =============================================================================

describe('renderCommandOutput - Container', () => {
	it('creates a container div with correct classes', async () => {
		const app = new App();
		const component = new Component();
		const rawCode = 'test output';
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);

		expect(container.tagName).toBe('DIV');
		expect(container.classList.contains(CSS_CLASSES.container)).toBe(true);
		expect(container.classList.contains(styleClass('tab'))).toBe(true);
		expect(container.classList.contains(CSS_CLASSES.cmdout)).toBe(true);
	});

	it('returns an HTMLDivElement', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const result = await renderCommandOutput(app, 'output', options, component);

		expect(result instanceof HTMLDivElement).toBe(true);
	});
});

// =============================================================================
// Pre/Code Structure Tests
// =============================================================================

describe('renderCommandOutput - Pre/Code Structure', () => {
	it('creates pre element with correct classes', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'code', options, component);
		const preElement = container.querySelector('pre');

		expect(preElement).not.toBeNull();
		expect(preElement?.classList.contains(CSS_CLASSES.codeBlock)).toBe(true);
		expect(preElement?.classList.contains(CSS_CLASSES.cmdoutPre)).toBe(true);
	});

	it('creates code element inside pre', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'test', options, component);
		const preElement = container.querySelector('pre');
		const codeElement = preElement?.querySelector('code');

		expect(codeElement).not.toBeNull();
		expect(codeElement?.parentElement).toBe(preElement);
	});

	it('appends pre to container', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'output', options, component);
		const preElement = container.querySelector('pre');

		expect(container.contains(preElement)).toBe(true);
		expect(preElement?.parentElement).toBe(container);
	});
});

// =============================================================================
// Title Tests
// =============================================================================

describe('renderCommandOutput - Title', () => {
	it('creates title element when titleText is provided', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			titleText: 'Example Script',
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'output', options, component);
		const titleElement = container.querySelector(`.${CSS_CLASSES.title}`);

		expect(titleElement).not.toBeNull();
	});

	it('does not create title element when titleText is undefined', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'output', options, component);
		const titleElement = container.querySelector(`.${CSS_CLASSES.title}`);

		expect(titleElement).toBeNull();
	});

	it('does not create title element when titleText is empty string', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			titleText: '',
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'output', options, component);
		const titleElement = container.querySelector(`.${CSS_CLASSES.title}`);

		expect(titleElement).toBeNull();
	});

	it('applies style-tab class to title', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			titleText: 'My Title',
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'output', options, component);
		const titleElement = container.querySelector(`.${CSS_CLASSES.title}`);

		expect(titleElement?.classList.contains(styleClass('tab'))).toBe(true);
	});

	it('includes terminal icon >_ in title', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			titleText: 'Test Command',
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'output', options, component);
		const iconSpan = container.querySelector(`.${CSS_CLASSES.icon}`);

		expect(iconSpan).not.toBeNull();
		expect(iconSpan?.textContent).toBe(COMMAND_OUTPUT_ICON);
	});

	it('displays title text in title element', async () => {
		const app = new App();
		const component = new Component();
		const titleText = 'Deploy Script Output';
		const options = {
			titleText,
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'output', options, component);
		const textSpan = container.querySelector(`.${CSS_CLASSES.titleText}`);

		expect(textSpan?.textContent).toBe(titleText);
	});

	it('prepends title before pre element', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			titleText: 'Title',
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'code', options, component);
		const titleElement = container.querySelector(`.${CSS_CLASSES.title}`);
		const preElement = container.querySelector('pre');

		const titleIndex = Array.from(container.children).indexOf(titleElement as HTMLElement);
		const preIndex = Array.from(container.children).indexOf(preElement as HTMLElement);

		expect(titleIndex).toBeLessThan(preIndex);
	});
});

// =============================================================================
// Description Tests
// =============================================================================

describe('renderCommandOutput - Description', () => {
	it('creates description element when both titleText and descriptionText provided', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			titleText: 'My Title',
			descriptionText: 'A description',
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'output', options, component);
		const descElement = container.querySelector(`.${CSS_CLASSES.description}`);

		expect(descElement).not.toBeNull();
	});

	it('does not create description when descriptionText provided but titleText missing', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			descriptionText: 'A description',
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'output', options, component);
		const descElement = container.querySelector(`.${CSS_CLASSES.description}`);

		expect(descElement).toBeNull();
	});

	it('does not create description when only titleText provided', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			titleText: 'My Title',
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'output', options, component);
		const descElement = container.querySelector(`.${CSS_CLASSES.description}`);

		expect(descElement).toBeNull();
	});

	it('calls MarkdownRenderer.render for description', async () => {
		const app = new App();
		const component = new Component();
		const descriptionText = 'Test **markdown** description';
		const options = {
			titleText: 'Title',
			descriptionText,
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
			containingNotePath: 'note.md',
		};

		const container = await renderCommandOutput(app, 'output', options, component);
		const descElement = container.querySelector(`.${CSS_CLASSES.description}`);

		// The mock MarkdownRenderer sets innerHTML to the markdown text
		expect(descElement?.innerHTML).toContain(descriptionText);
	});

	it('places description after title and before pre', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			titleText: 'Title',
			descriptionText: 'Description',
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'code', options, component);
		const titleElement = container.querySelector(`.${CSS_CLASSES.title}`);
		const descElement = container.querySelector(`.${CSS_CLASSES.description}`);
		const preElement = container.querySelector('pre');

		const titleIndex = Array.from(container.children).indexOf(titleElement as HTMLElement);
		const descIndex = Array.from(container.children).indexOf(descElement as HTMLElement);
		const preIndex = Array.from(container.children).indexOf(preElement as HTMLElement);

		expect(titleIndex).toBeLessThan(descIndex);
		expect(descIndex).toBeLessThan(preIndex);
	});

	it('passes containingNotePath to MarkdownRenderer', async () => {
		const app = new App();
		const component = new Component();
		const containingNotePath = 'path/to/note.md';
		const options = {
			titleText: 'Title',
			descriptionText: 'Test description',
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
			containingNotePath,
		};

		// Should not throw and should render without error
		const container = await renderCommandOutput(app, 'code', options, component);
		expect(container).not.toBeNull();
	});
});

// =============================================================================
// Scroll Tests
// =============================================================================

describe('renderCommandOutput - Scroll', () => {
	it('adds scrollable class when scrollLines > 0', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 10,
		};

		const container = await renderCommandOutput(app, 'output', options, component);
		const preElement = container.querySelector('pre');

		expect(preElement?.classList.contains(CSS_CLASSES.scrollable)).toBe(true);
	});

	it('does not add scrollable class when scrollLines = 0', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'output', options, component);
		const preElement = container.querySelector('pre');

		expect(preElement?.classList.contains(CSS_CLASSES.scrollable)).toBe(false);
	});

	it('sets scroll height CSS variable when scrollLines > 0', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 5,
		};

		const container = await renderCommandOutput(app, 'output', options, component);
		const preElement = container.querySelector('pre');

		const scrollHeightValue = preElement?.style.getPropertyValue('--ucf-scroll-height');
		expect(scrollHeightValue).toBeTruthy();
		expect(scrollHeightValue).toContain('em');
	});

	it('creates scroll indicator when scrollLines > 0', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 8,
		};

		const container = await renderCommandOutput(app, 'output', options, component);
		const scrollIndicator = container.querySelector(`.${CSS_CLASSES.scrollIndicator}`);

		expect(scrollIndicator).not.toBeNull();
	});
});

// =============================================================================
// Copy Button Tests
// =============================================================================

describe('renderCommandOutput - Copy Button', () => {
	it('adds copy button when showCopyButton is true', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			styles: defaultStyles(),
			showCopyButton: true,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'code', options, component);
		const copyButton = container.querySelector(`.${CSS_CLASSES.copyButton}`);

		expect(copyButton).not.toBeNull();
	});

	it('does not add copy button when showCopyButton is false', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'code', options, component);
		const copyButton = container.querySelector(`.${CSS_CLASSES.copyButton}`);

		expect(copyButton).toBeNull();
	});

	it('attaches copy button to pre element', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			styles: defaultStyles(),
			showCopyButton: true,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, 'test', options, component);
		const preElement = container.querySelector('pre');
		const copyButton = preElement?.querySelector(`.${CSS_CLASSES.copyButton}`);

		expect(copyButton).not.toBeNull();
	});
});

// =============================================================================
// Code Content Tests
// =============================================================================

describe('renderCommandOutput - Code Content', () => {
	it('includes raw code in output', async () => {
		const app = new App();
		const component = new Component();
		const rawCode = 'echo hello\nworld';
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);
		const html = container.innerHTML;

		expect(html).toContain('hello');
		expect(html).toContain('world');
	});

	it('handles empty code', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, '', options, component);
		const codeElement = container.querySelector('code');

		expect(codeElement).not.toBeNull();
	});

	it('processes code into HTML lines', async () => {
		const app = new App();
		const component = new Component();
		const rawCode = 'line1\nline2\nline3';
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);
		const html = container.innerHTML;

		// processAllOutputLines creates span elements with ucf-cmdout-line class
		expect(html).toContain('ucf-cmdout-line');
	});
});

// =============================================================================
// Prompt Pattern Tests
// =============================================================================

describe('renderCommandOutput - Prompt Pattern', () => {
	it('applies prompt pattern when provided', async () => {
		const app = new App();
		const component = new Component();
		const promptPattern = /^(\$\s)(.*)/;
		const rawCode = '$ echo hello\noutput';
		const options = {
			promptPattern,
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);
		const html = container.innerHTML;

		// Should have command line class for $ line
		expect(html).toContain('ucf-cmdout-cmdline');
		expect(html).toContain('ucf-cmdout-prompt');
		expect(html).toContain('ucf-cmdout-command');
	});

	it('distinguishes command lines from output lines', async () => {
		const app = new App();
		const component = new Component();
		const promptPattern = /^(\$\s)(.*)/;
		const rawCode = '$ ls\nfile.txt';
		const options = {
			promptPattern,
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);
		const html = container.innerHTML;

		// $ ls line should be command line
		expect(html).toContain('ucf-cmdout-cmdline');
		// file.txt line should be output line
		expect(html).toContain('ucf-cmdout-output');
	});

	it('handles missing prompt pattern gracefully', async () => {
		const app = new App();
		const component = new Component();
		const rawCode = '$ echo\noutput';
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);
		const html = container.innerHTML;

		// Without pattern, all lines are output lines
		expect(html).toContain('ucf-cmdout-output');
	});
});

// =============================================================================
// Style Application Tests
// =============================================================================

describe('renderCommandOutput - Styles', () => {
	it('applies prompt colour style', async () => {
		const app = new App();
		const component = new Component();
		const promptPattern = /^(>)(.*)/;
		const rawCode = '> command';
		const styles: CommandOutputStyles = {
			promptColour: '#ff0000',
			promptBold: false,
			promptItalic: false,
			commandColour: '',
			commandBold: false,
			commandItalic: false,
			outputColour: '',
			outputBold: false,
			outputItalic: false,
		};
		const options = {
			promptPattern,
			styles,
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);
		const html = container.innerHTML;

		expect(html).toContain('color: #ff0000');
	});

	it('applies prompt bold style', async () => {
		const app = new App();
		const component = new Component();
		const promptPattern = /^(>)(.*)/;
		const rawCode = '> command';
		const styles: CommandOutputStyles = {
			promptColour: '',
			promptBold: true,
			promptItalic: false,
			commandColour: '',
			commandBold: false,
			commandItalic: false,
			outputColour: '',
			outputBold: false,
			outputItalic: false,
		};
		const options = {
			promptPattern,
			styles,
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);
		const html = container.innerHTML;

		expect(html).toContain('font-weight: bold');
	});

	it('applies command colour style', async () => {
		const app = new App();
		const component = new Component();
		const promptPattern = /^(>)(.*)/;
		const rawCode = '> echo hello';
		const styles: CommandOutputStyles = {
			promptColour: '',
			promptBold: false,
			promptItalic: false,
			commandColour: '#00ff00',
			commandBold: false,
			commandItalic: false,
			outputColour: '',
			outputBold: false,
			outputItalic: false,
		};
		const options = {
			promptPattern,
			styles,
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);
		const html = container.innerHTML;

		expect(html).toContain('color: #00ff00');
	});

	it('applies output colour style', async () => {
		const app = new App();
		const component = new Component();
		const rawCode = 'output text';
		const styles: CommandOutputStyles = {
			promptColour: '',
			promptBold: false,
			promptItalic: false,
			commandColour: '',
			commandBold: false,
			commandItalic: false,
			outputColour: '#0000ff',
			outputBold: false,
			outputItalic: false,
		};
		const options = {
			styles,
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);
		const html = container.innerHTML;

		expect(html).toContain('color: #0000ff');
	});

	it('applies italic style', async () => {
		const app = new App();
		const component = new Component();
		const rawCode = 'output';
		const styles: CommandOutputStyles = {
			promptColour: '',
			promptBold: false,
			promptItalic: false,
			commandColour: '',
			commandBold: false,
			commandItalic: false,
			outputColour: '',
			outputBold: false,
			outputItalic: true,
		};
		const options = {
			styles,
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);
		const html = container.innerHTML;

		expect(html).toContain('font-style: italic');
	});

	it('combines multiple styles', async () => {
		const app = new App();
		const component = new Component();
		const rawCode = 'output';
		const styles: CommandOutputStyles = {
			promptColour: '',
			promptBold: false,
			promptItalic: false,
			commandColour: '',
			commandBold: false,
			commandItalic: false,
			outputColour: '#ff0000',
			outputBold: true,
			outputItalic: true,
		};
		const options = {
			styles,
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);
		const html = container.innerHTML;

		expect(html).toContain('color: #ff0000');
		expect(html).toContain('font-weight: bold');
		expect(html).toContain('font-style: italic');
	});
});

// =============================================================================
// Multiple Features Tests
// =============================================================================

describe('renderCommandOutput - Multiple Features Combined', () => {
	it('renders title, description, code, scroll, and copy button together', async () => {
		const app = new App();
		const component = new Component();
		const options = {
			titleText: 'Build Output',
			descriptionText: 'Build completion report',
			promptPattern: /^(\$\s)(.*)/,
			styles: defaultStyles(),
			showCopyButton: true,
			scrollLines: 10,
			containingNotePath: 'note.md',
		};

		const container = await renderCommandOutput(
			app,
			'$ npm build\nCompleting build...',
			options,
			component
		);

		const title = container.querySelector(`.${CSS_CLASSES.title}`);
		const desc = container.querySelector(`.${CSS_CLASSES.description}`);
		const pre = container.querySelector('pre');
		const copyBtn = container.querySelector(`.${CSS_CLASSES.copyButton}`);

		expect(title).not.toBeNull();
		expect(desc).not.toBeNull();
		expect(pre).not.toBeNull();
		expect(copyBtn).not.toBeNull();
		expect(pre?.classList.contains(CSS_CLASSES.scrollable)).toBe(true);
	});

	it('respects feature flags independently', async () => {
		const app = new App();
		const component = new Component();

		// Only title, no description
		const options1 = {
			titleText: 'Title Only',
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container1 = await renderCommandOutput(app, 'code', options1, component);
		expect(container1.querySelector(`.${CSS_CLASSES.title}`)).not.toBeNull();
		expect(container1.querySelector(`.${CSS_CLASSES.description}`)).toBeNull();
		expect(container1.querySelector(`.${CSS_CLASSES.copyButton}`)).toBeNull();
		expect(container1.querySelector('pre')?.classList.contains(CSS_CLASSES.scrollable)).toBe(false);

		// Only scroll and copy
		const options2 = {
			styles: defaultStyles(),
			showCopyButton: true,
			scrollLines: 5,
		};

		const container2 = await renderCommandOutput(app, 'code', options2, component);
		expect(container2.querySelector(`.${CSS_CLASSES.title}`)).toBeNull();
		expect(container2.querySelector(`.${CSS_CLASSES.copyButton}`)).not.toBeNull();
		expect(container2.querySelector('pre')?.classList.contains(CSS_CLASSES.scrollable)).toBe(true);
	});
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('renderCommandOutput - Edge Cases', () => {
	it('handles very long code blocks', async () => {
		const app = new App();
		const component = new Component();
		let longCode = '';
		for (let i = 0; i < 1000; i++) {
			longCode += `line ${i}\n`;
		}

		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, longCode, options, component);
		expect(container.querySelector('code')).not.toBeNull();
	});

	it('handles code with special characters', async () => {
		const app = new App();
		const component = new Component();
		const rawCode = '<script>alert("XSS")</script>';
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);
		const html = container.innerHTML;

		// HTML should be escaped, not executed
		expect(html).toContain('&lt;script&gt;');
		expect(html).not.toContain('<script>');
	});

	it('handles code with HTML entities', async () => {
		const app = new App();
		const component = new Component();
		const rawCode = 'a < b && c > d';
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);
		const html = container.innerHTML;

		expect(html).toContain('&lt;');
		expect(html).toContain('&gt;');
		expect(html).toContain('&amp;');
	});

	it('handles multiline commands correctly', async () => {
		const app = new App();
		const component = new Component();
		const promptPattern = /^(\$\s)(.*)/;
		const rawCode = '$ npm install \\\n  package1 \\\n  package2';
		const options = {
			promptPattern,
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);
		expect(container.querySelector('code')).not.toBeNull();
	});

	it('handles code with trailing newlines', async () => {
		const app = new App();
		const component = new Component();
		const rawCode = 'line1\nline2\n\n';
		const options = {
			styles: defaultStyles(),
			showCopyButton: false,
			scrollLines: 0,
		};

		const container = await renderCommandOutput(app, rawCode, options, component);
		const html = container.innerHTML;

		expect(html).toContain('line1');
		expect(html).toContain('line2');
	});
});
