// @vitest-environment jsdom

/**
 * Tests for src/services/download-service.ts
 *
 * Covers the download path which creates a Blob and triggers a browser download
 * via an anchor element. Tests Blob creation, URL handling, anchor element
 * manipulation, and file download trigger.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadCodeToFile } from '../../src/services/download-service';

describe('downloadCodeToFile (jsdom)', () => {
	let mockCreateObjectURL: ReturnType<typeof vi.fn>;
	let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
	let clickSpy: ReturnType<typeof vi.fn>;
	let appendChildSpy: ReturnType<typeof vi.spyOn>;
	let removeChildSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
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
		vi.restoreAllMocks();
	});

	// ============================================================================
	// Core Functionality Tests
	// ============================================================================

	it('creates a Blob with code text and text/plain MIME type', () => {
		const codeText = 'console.log("hello");';
		const suggestedFilename = 'script.js';
		const blobSpy = vi.spyOn(global, 'Blob');

		downloadCodeToFile(codeText, suggestedFilename);

		expect(blobSpy).toHaveBeenCalledWith([codeText], {
			type: 'text/plain;charset=utf-8',
		});
	});

	it('calls URL.createObjectURL with the Blob', () => {
		const codeText = 'const x = 42;';
		const suggestedFilename = 'code.js';

		downloadCodeToFile(codeText, suggestedFilename);

		expect(mockCreateObjectURL).toHaveBeenCalled();
		const blobArg = mockCreateObjectURL.mock.calls[0][0];
		expect(blobArg).toBeInstanceOf(Blob);
	});

	it('sets anchor.href to the blob URL', () => {
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

		downloadCodeToFile(codeText, suggestedFilename);

		expect(capturedAnchor?.href).toBe(blobUrl);
	});

	it('sets anchor.download to suggested filename', () => {
		const codeText = 'test code';
		const suggestedFilename = 'my-script.js';

		let capturedAnchor: HTMLAnchorElement | null = null;
		vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
			if (node instanceof HTMLAnchorElement) {
				capturedAnchor = node;
			}
			return node as never;
		});

		downloadCodeToFile(codeText, suggestedFilename);

		expect(capturedAnchor?.download).toBe(suggestedFilename);
	});

	it('sets anchor.hidden to true', () => {
		const codeText = 'test code';
		const suggestedFilename = 'test.txt';

		let capturedAnchor: HTMLAnchorElement | null = null;
		vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
			if (node instanceof HTMLAnchorElement) {
				capturedAnchor = node;
			}
			return node as never;
		});

		downloadCodeToFile(codeText, suggestedFilename);

		expect(capturedAnchor?.hidden).toBe(true);
	});

	it('appends anchor to document.body then removes it', () => {
		const codeText = 'test code';
		const suggestedFilename = 'test.txt';

		downloadCodeToFile(codeText, suggestedFilename);

		expect(appendChildSpy).toHaveBeenCalled();
		expect(removeChildSpy).toHaveBeenCalled();

		// Verify append was called before remove
		const appendCallIndex = appendChildSpy.mock.invocationCallOrder[0];
		const removeCallIndex = removeChildSpy.mock.invocationCallOrder[0];
		expect(appendCallIndex).toBeLessThan(removeCallIndex);
	});

	it('calls anchor.click() to trigger download', () => {
		const codeText = 'test code';
		const suggestedFilename = 'test.txt';

		downloadCodeToFile(codeText, suggestedFilename);

		expect(clickSpy).toHaveBeenCalled();
	});

	it('calls URL.revokeObjectURL to clean up blob URL', () => {
		const codeText = 'test code';
		const suggestedFilename = 'test.txt';
		const blobUrl = 'blob:mock-url-456';
		mockCreateObjectURL.mockReturnValue(blobUrl);

		downloadCodeToFile(codeText, suggestedFilename);

		expect(mockRevokeObjectURL).toHaveBeenCalledWith(blobUrl);
	});

	// ============================================================================
	// Edge Cases and Special Scenarios
	// ============================================================================

	it('works with empty code text', () => {
		const codeText = '';
		const suggestedFilename = 'empty.txt';

		downloadCodeToFile(codeText, suggestedFilename);

		expect(mockCreateObjectURL).toHaveBeenCalled();
		expect(clickSpy).toHaveBeenCalled();
		expect(mockRevokeObjectURL).toHaveBeenCalled();
	});

	it('works with special characters in filename', () => {
		const codeText = 'code here';
		const suggestedFilename = 'my-file_v2.0.js';

		let capturedAnchor: HTMLAnchorElement | null = null;
		vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
			if (node instanceof HTMLAnchorElement) {
				capturedAnchor = node;
			}
			return node as never;
		});

		downloadCodeToFile(codeText, suggestedFilename);

		expect(capturedAnchor?.download).toBe(suggestedFilename);
	});

	it('works with multiline code text', () => {
		const codeText = `function hello() {
  console.log('world');
  return 42;
}`;
		const suggestedFilename = 'multi.js';
		const blobSpy = vi.spyOn(global, 'Blob');

		downloadCodeToFile(codeText, suggestedFilename);

		const blobCall = blobSpy.mock.calls[0];
		expect(blobCall[0][0]).toBe(codeText);
	});

	it('anchor is appended and removed in correct order', () => {
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

		downloadCodeToFile(codeText, suggestedFilename);

		// Verify appendChild was called before removeChild
		expect(callSequence).toEqual(['appendChild', 'removeChild']);
	});
});
