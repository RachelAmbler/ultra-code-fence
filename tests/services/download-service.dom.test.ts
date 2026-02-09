// @vitest-environment jsdom

/**
 * Tests for src/services/download-service.ts
 *
 * Covers the mobile download path (downloadMobile function) which is called
 * when Platform.isDesktopApp is false. Tests the Blob creation, URL handling,
 * anchor element manipulation, and file download trigger.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Platform } from '../../src/__mocks__/obsidian';
import { downloadCodeToFile } from '../../src/services/download-service';
import { testSettings } from '../helpers/test-settings';

describe('downloadCodeToFile - Mobile Path (jsdom)', () => {
	let mockCreateObjectURL: ReturnType<typeof vi.fn>;
	let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
	let clickSpy: ReturnType<typeof vi.fn>;
	let appendChildSpy: ReturnType<typeof vi.spyOn>;
	let removeChildSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// Set mobile platform
		Platform.isDesktopApp = false;

		// Mock URL APIs
		mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
		mockRevokeObjectURL = vi.fn();
		global.URL.createObjectURL = mockCreateObjectURL;
		global.URL.revokeObjectURL = mockRevokeObjectURL;

		// Spy on anchor.click
		clickSpy = vi.fn();
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickSpy);

		// Spy on document.body DOM manipulation
		appendChildSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(
			document.createElement('a') as never
		);
		removeChildSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(
			document.createElement('a') as never
		);
	});

	afterEach(() => {
		Platform.isDesktopApp = true;
		vi.restoreAllMocks();
	});

	// ============================================================================
	// Core Functionality Tests
	// ============================================================================

	it('creates a Blob with code text and text/plain MIME type', async () => {
		const codeText = 'console.log("hello");';
		const suggestedFilename = 'script.js';
		const blobSpy = vi.spyOn(global, 'Blob');

		await downloadCodeToFile(
			codeText,
			suggestedFilename,
			'note.md',
			testSettings(),
			vi.fn()
		);

		expect(blobSpy).toHaveBeenCalledWith([codeText], {
			type: 'text/plain;charset=utf-8',
		});
	});

	it('calls URL.createObjectURL with the Blob', async () => {
		const codeText = 'const x = 42;';
		const suggestedFilename = 'code.js';

		await downloadCodeToFile(
			codeText,
			suggestedFilename,
			'note.md',
			testSettings(),
			vi.fn()
		);

		expect(mockCreateObjectURL).toHaveBeenCalled();
		const blobArg = mockCreateObjectURL.mock.calls[0][0];
		expect(blobArg).toBeInstanceOf(Blob);
	});

	it('sets anchor.href to the blob URL', async () => {
		const codeText = 'test code';
		const suggestedFilename = 'test.txt';
		const blobUrl = 'blob:mock-url-123';
		mockCreateObjectURL.mockReturnValue(blobUrl);

		let capturedAnchor: HTMLAnchorElement | null = null;
		vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
			if (node instanceof HTMLAnchorElement) {
				capturedAnchor = node;
			}
			return node as never;
		});

		await downloadCodeToFile(
			codeText,
			suggestedFilename,
			'note.md',
			testSettings(),
			vi.fn()
		);

		expect(capturedAnchor?.href).toBe(blobUrl);
	});

	it('sets anchor.download to suggested filename', async () => {
		const codeText = 'test code';
		const suggestedFilename = 'my-script.js';

		let capturedAnchor: HTMLAnchorElement | null = null;
		vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
			if (node instanceof HTMLAnchorElement) {
				capturedAnchor = node;
			}
			return node as never;
		});

		await downloadCodeToFile(
			codeText,
			suggestedFilename,
			'note.md',
			testSettings(),
			vi.fn()
		);

		expect(capturedAnchor?.download).toBe(suggestedFilename);
	});

	it('sets anchor.hidden to true', async () => {
		const codeText = 'test code';
		const suggestedFilename = 'test.txt';

		let capturedAnchor: HTMLAnchorElement | null = null;
		vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
			if (node instanceof HTMLAnchorElement) {
				capturedAnchor = node;
			}
			return node as never;
		});

		await downloadCodeToFile(
			codeText,
			suggestedFilename,
			'note.md',
			testSettings(),
			vi.fn()
		);

		expect(capturedAnchor?.hidden).toBe(true);
	});

	it('appends anchor to document.body then removes it', async () => {
		const codeText = 'test code';
		const suggestedFilename = 'test.txt';

		await downloadCodeToFile(
			codeText,
			suggestedFilename,
			'note.md',
			testSettings(),
			vi.fn()
		);

		expect(appendChildSpy).toHaveBeenCalled();
		expect(removeChildSpy).toHaveBeenCalled();

		// Verify append was called before remove
		const appendCallIndex = appendChildSpy.mock.invocationCallOrder[0];
		const removeCallIndex = removeChildSpy.mock.invocationCallOrder[0];
		expect(appendCallIndex).toBeLessThan(removeCallIndex);
	});

	it('calls anchor.click() to trigger download', async () => {
		const codeText = 'test code';
		const suggestedFilename = 'test.txt';

		await downloadCodeToFile(
			codeText,
			suggestedFilename,
			'note.md',
			testSettings(),
			vi.fn()
		);

		expect(clickSpy).toHaveBeenCalled();
	});

	it('calls URL.revokeObjectURL to clean up blob URL', async () => {
		const codeText = 'test code';
		const suggestedFilename = 'test.txt';
		const blobUrl = 'blob:mock-url-456';
		mockCreateObjectURL.mockReturnValue(blobUrl);

		await downloadCodeToFile(
			codeText,
			suggestedFilename,
			'note.md',
			testSettings(),
			vi.fn()
		);

		expect(mockRevokeObjectURL).toHaveBeenCalledWith(blobUrl);
	});

	// ============================================================================
	// Edge Cases and Special Scenarios
	// ============================================================================

	it('works with empty code text', async () => {
		const codeText = '';
		const suggestedFilename = 'empty.txt';

		await downloadCodeToFile(
			codeText,
			suggestedFilename,
			'note.md',
			testSettings(),
			vi.fn()
		);

		expect(mockCreateObjectURL).toHaveBeenCalled();
		expect(clickSpy).toHaveBeenCalled();
		expect(mockRevokeObjectURL).toHaveBeenCalled();
	});

	it('works with special characters in filename', async () => {
		const codeText = 'code here';
		const suggestedFilename = 'my-file_v2.0.js';

		let capturedAnchor: HTMLAnchorElement | null = null;
		vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
			if (node instanceof HTMLAnchorElement) {
				capturedAnchor = node;
			}
			return node as never;
		});

		await downloadCodeToFile(
			codeText,
			suggestedFilename,
			'note.md',
			testSettings(),
			vi.fn()
		);

		expect(capturedAnchor?.download).toBe(suggestedFilename);
	});

	it('works with multiline code text', async () => {
		const codeText = `function hello() {
  console.log('world');
  return 42;
}`;
		const suggestedFilename = 'multi.js';
		const blobSpy = vi.spyOn(global, 'Blob');

		await downloadCodeToFile(
			codeText,
			suggestedFilename,
			'note.md',
			testSettings(),
			vi.fn()
		);

		const blobCall = blobSpy.mock.calls[0];
		expect(blobCall[0][0]).toBe(codeText);
	});

	it('anchor is appended and removed in correct order', async () => {
		const codeText = 'test code';
		const suggestedFilename = 'test.txt';
		const callSequence: string[] = [];

		// Track the sequence of operations
		appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
			if (node instanceof HTMLAnchorElement) {
				callSequence.push('appendChild');
			}
			return node as never;
		});

		removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => {
			if (node instanceof HTMLAnchorElement) {
				callSequence.push('removeChild');
			}
			return node as never;
		});

		await downloadCodeToFile(
			codeText,
			suggestedFilename,
			'note.md',
			testSettings(),
			vi.fn()
		);

		// Verify appendChild was called before removeChild
		expect(callSequence).toEqual(['appendChild', 'removeChild']);
	});
});
