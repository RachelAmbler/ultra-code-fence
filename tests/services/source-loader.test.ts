/**
 * Tests for src/services/source-loader.ts
 *
 * Covers the pure functions: detectSourceLocationType, isRemotePath,
 * isVaultPath, extractFileMetadata, createEmbeddedCodeMetadata
 */

import { describe, it, expect } from 'vitest';
import {
	detectSourceLocationType,
	isRemotePath,
	isVaultPath,
	extractFileMetadata,
	createEmbeddedCodeMetadata,
} from '../../src/services/source-loader';

// =============================================================================
// detectSourceLocationType
// =============================================================================

describe('detectSourceLocationType', () => {
	it('returns "embedded" for undefined', () => {
		expect(detectSourceLocationType(undefined)).toBe('embedded');
	});

	it('returns "embedded" for empty string', () => {
		expect(detectSourceLocationType('')).toBe('embedded');
	});

	it('returns "vault" for vault:// paths', () => {
		expect(detectSourceLocationType('vault://src/main.ts')).toBe('vault');
	});

	it('returns "remote" for https:// URLs', () => {
		expect(detectSourceLocationType('https://example.com/file.ts')).toBe('remote');
	});

	it('returns "remote" for http:// URLs', () => {
		expect(detectSourceLocationType('http://example.com/file.ts')).toBe('remote');
	});

	it('returns "invalid" for bare file paths', () => {
		expect(detectSourceLocationType('src/main.ts')).toBe('invalid');
	});

	it('returns "invalid" for other schemes', () => {
		expect(detectSourceLocationType('ftp://server/file')).toBe('invalid');
	});
});

// =============================================================================
// isRemotePath
// =============================================================================

describe('isRemotePath', () => {
	it('returns true for https URLs', () => {
		expect(isRemotePath('https://example.com/file.js')).toBe(true);
	});

	it('returns true for http URLs', () => {
		expect(isRemotePath('http://example.com/file.js')).toBe(true);
	});

	it('returns false for vault paths', () => {
		expect(isRemotePath('vault://src/main.ts')).toBe(false);
	});

	it('returns false for bare paths', () => {
		expect(isRemotePath('src/main.ts')).toBe(false);
	});

	it('returns false for empty string', () => {
		expect(isRemotePath('')).toBe(false);
	});
});

// =============================================================================
// isVaultPath
// =============================================================================

describe('isVaultPath', () => {
	it('returns true for vault:// paths', () => {
		expect(isVaultPath('vault://notes/example.md')).toBe(true);
	});

	it('returns false for remote URLs', () => {
		expect(isVaultPath('https://example.com')).toBe(false);
	});

	it('returns false for bare paths', () => {
		expect(isVaultPath('notes/example.md')).toBe(false);
	});

	it('returns false for empty string', () => {
		expect(isVaultPath('')).toBe(false);
	});
});

// =============================================================================
// extractFileMetadata — vault / local paths
// =============================================================================

describe('extractFileMetadata — local paths', () => {
	it('extracts filename from a simple path', () => {
		const meta = extractFileMetadata('src/utils/helper.ts');
		expect(meta.filename).toBe('helper.ts');
	});

	it('extracts basename without extension', () => {
		const meta = extractFileMetadata('src/utils/helper.ts');
		expect(meta.basename).toBe('helper');
	});

	it('extracts extension', () => {
		const meta = extractFileMetadata('src/utils/helper.ts');
		expect(meta.extension).toBe('ts');
	});

	it('extracts parent folder', () => {
		const meta = extractFileMetadata('src/utils/helper.ts');
		expect(meta.parentFolder).toBe('src/utils');
	});

	it('stores full path as-is', () => {
		const meta = extractFileMetadata('src/utils/helper.ts');
		expect(meta.fullPath).toBe('src/utils/helper.ts');
	});

	it('handles file with no extension', () => {
		const meta = extractFileMetadata('Makefile');
		expect(meta.basename).toBe('Makefile');
		expect(meta.extension).toBe('');
	});

	it('handles dotfiles', () => {
		const meta = extractFileMetadata('.gitignore');
		expect(meta.basename).toBe('.gitignore');
		expect(meta.extension).toBe('');
	});

	it('handles multi-dot filenames', () => {
		const meta = extractFileMetadata('app.config.json');
		expect(meta.basename).toBe('app.config');
		expect(meta.extension).toBe('json');
	});

	it('sets parent folder to / for root-level files', () => {
		const meta = extractFileMetadata('file.txt');
		expect(meta.parentFolder).toBe('/');
	});

	it('includes fileStat when provided', () => {
		const stat = { mtime: 1000, ctime: 500, size: 2048 };
		const meta = extractFileMetadata('file.ts', stat);
		expect(meta.modifiedTime).toBe(1000);
		expect(meta.createdTime).toBe(500);
		expect(meta.sizeInBytes).toBe(2048);
	});

	it('omits stat fields when not provided', () => {
		const meta = extractFileMetadata('file.ts');
		expect(meta.modifiedTime).toBeUndefined();
		expect(meta.createdTime).toBeUndefined();
		expect(meta.sizeInBytes).toBeUndefined();
	});
});

// =============================================================================
// extractFileMetadata — remote URLs
// =============================================================================

describe('extractFileMetadata — remote URLs', () => {
	it('extracts filename from URL path', () => {
		const meta = extractFileMetadata('https://example.com/repo/main.py');
		expect(meta.filename).toBe('main.py');
	});

	it('extracts basename and extension from URL', () => {
		const meta = extractFileMetadata('https://example.com/repo/main.py');
		expect(meta.basename).toBe('main');
		expect(meta.extension).toBe('py');
	});

	it('extracts parent folder from URL path', () => {
		const meta = extractFileMetadata('https://example.com/repo/main.py');
		expect(meta.parentFolder).toBe('/repo');
	});

	it('stores full URL as fullPath', () => {
		const url = 'https://example.com/repo/main.py';
		const meta = extractFileMetadata(url);
		expect(meta.fullPath).toBe(url);
	});

	it('falls back to "remote-file" for URLs with no filename', () => {
		const meta = extractFileMetadata('https://example.com/');
		expect(meta.filename).toBe('remote-file');
	});

	it('handles URL with query params', () => {
		const meta = extractFileMetadata('https://raw.githubusercontent.com/user/repo/main/file.ts?token=abc');
		expect(meta.filename).toBe('file.ts');
		expect(meta.extension).toBe('ts');
	});

	it('handles deeply nested URL paths', () => {
		const meta = extractFileMetadata('https://github.com/user/repo/blob/main/src/utils/helper.ts');
		expect(meta.filename).toBe('helper.ts');
		expect(meta.parentFolder).toBe('/user/repo/blob/main/src/utils');
	});
});

// =============================================================================
// createEmbeddedCodeMetadata
// =============================================================================

describe('createEmbeddedCodeMetadata', () => {
	it('uses title as filename and basename', () => {
		const meta = createEmbeddedCodeMetadata('My Script', 'python');
		expect(meta.filename).toBe('My Script');
		expect(meta.basename).toBe('My Script');
	});

	it('uses language as extension', () => {
		const meta = createEmbeddedCodeMetadata('test', 'typescript');
		expect(meta.extension).toBe('typescript');
	});

	it('falls back to "inline" when title is undefined', () => {
		const meta = createEmbeddedCodeMetadata(undefined, 'js');
		expect(meta.filename).toBe('inline');
		expect(meta.basename).toBe('inline');
	});

	it('preserves empty string title when explicitly provided', () => {
		const meta = createEmbeddedCodeMetadata('', 'js');
		expect(meta.filename).toBe('');
	});

	it('sets fullPath and parentFolder to empty strings', () => {
		const meta = createEmbeddedCodeMetadata('test', 'py');
		expect(meta.fullPath).toBe('');
		expect(meta.parentFolder).toBe('');
	});

	it('does not include stat fields', () => {
		const meta = createEmbeddedCodeMetadata('test', 'py');
		expect(meta.modifiedTime).toBeUndefined();
		expect(meta.createdTime).toBeUndefined();
		expect(meta.sizeInBytes).toBeUndefined();
	});
});
