/**
 * Ultra Code Fence - Source Loader
 *
 * Handles loading source code from various locations including vault files
 * and remote URLs. Abstracts the complexity of different source types
 * behind a unified interface.
 */

import { App, TFile, requestUrl } from 'obsidian';
import type { SourceFileMetadata, SourceLoadResult, SourceLocationType } from '../types';
import { VAULT_PREFIX, HTTPS_PREFIX, HTTP_PREFIX } from '../constants';

// =============================================================================
// Source Type Detection
// =============================================================================

/**
 * Determines the type of source based on the path.
 *
 * @param path - Source path or undefined for embedded code
 * @returns The detected source location type
 */
export function detectSourceLocationType(path: string | undefined): SourceLocationType {
	if (!path) {
		return 'embedded';
	}

	if (path.startsWith(VAULT_PREFIX)) {
		return 'vault';
	}

	if (path.startsWith(HTTPS_PREFIX) || path.startsWith(HTTP_PREFIX)) {
		return 'remote';
	}

	return 'invalid';
}

/**
 * Checks if a path refers to a remote URL.
 *
 * @param path - Path to check
 * @returns True if the path is a remote URL
 */
export function isRemotePath(path: string): boolean {
	return path.startsWith(HTTPS_PREFIX) || path.startsWith(HTTP_PREFIX);
}

/**
 * Checks if a path refers to a vault file.
 *
 * @param path - Path to check
 * @returns True if the path is a vault path
 */
export function isVaultPath(path: string): boolean {
	return path.startsWith(VAULT_PREFIX);
}

// =============================================================================
// Source Loading
// =============================================================================

/**
 * Loads source code from a vault file.
 *
 * @param app - Obsidian App instance
 * @param vaultPath - Path with vault:// prefix
 * @returns Load result with content and metadata
 */
export async function loadVaultFile(app: App, vaultPath: string): Promise<SourceLoadResult> {
	const strippedPath = vaultPath.replace(/^vault:\/\//, '');

	const file = app.vault.getAbstractFileByPath(strippedPath);

	if (!(file instanceof TFile)) {
		return {
			succeeded: false,
			sourceCode: '',
			fileMetadata: null,
			errorMessage: `couldn't read file '${strippedPath}'`,
		};
	}

	try {
		const sourceCode = await app.vault.read(file);
		const fileMetadata = extractFileMetadata(strippedPath, file.stat);

		return {
			succeeded: true,
			sourceCode,
			fileMetadata,
		};
	} catch {
		return {
			succeeded: false,
			sourceCode: '',
			fileMetadata: null,
			errorMessage: `failed to read file '${strippedPath}'`,
		};
	}
}

/**
 * Loads source code from a remote URL.
 *
 * @param url - Full URL (http:// or https://)
 * @returns Load result with content and metadata
 */
export async function loadRemoteFile(url: string): Promise<SourceLoadResult> {
	try {
		const response = await requestUrl({ url, method: 'GET' });
		const fileMetadata = extractFileMetadata(url);

		return {
			succeeded: true,
			sourceCode: response.text,
			fileMetadata,
		};
	} catch {
		return {
			succeeded: false,
			sourceCode: '',
			fileMetadata: null,
			errorMessage: `couldn't fetch '${url}'`,
		};
	}
}

/**
 * Loads source code from any supported source type.
 *
 * @param app - Obsidian App instance
 * @param path - Source path (vault:// or http[s]://)
 * @returns Load result with content and metadata
 */
export async function loadSource(app: App, path: string): Promise<SourceLoadResult> {
	const locationType = detectSourceLocationType(path);

	switch (locationType) {
		case 'vault':
			return loadVaultFile(app, path);

		case 'remote':
			return loadRemoteFile(path);

		case 'embedded':
			return {
				succeeded: false,
				sourceCode: '',
				fileMetadata: null,
				errorMessage: 'No source path provided',
			};

		case 'invalid':
			return {
				succeeded: false,
				sourceCode: '',
				fileMetadata: null,
				errorMessage: "invalid source path, use 'vault://...' or 'http[s]://...'",
			};
	}
}

// =============================================================================
// Metadata Extraction
// =============================================================================

/**
 * Extracts metadata from a file path and optional stat info.
 *
 * For remote URLs, only basic path information is available.
 * For vault files, modification time and size are included.
 *
 * @param path - File path or URL
 * @param fileStat - Optional file statistics from vault
 * @returns Extracted metadata
 */
export function extractFileMetadata(
	path: string,
	fileStat?: { mtime: number; ctime: number; size: number }
): SourceFileMetadata {
	const isUrl = path.startsWith(HTTPS_PREFIX) || path.startsWith(HTTP_PREFIX);

	let filename: string;
	let parentFolder: string;

	if (isUrl) {
		try {
			const urlPath = new URL(path).pathname;
			const parts = urlPath.split('/');
			filename = parts[parts.length - 1] || 'remote-file';
			parentFolder = parts.slice(0, -1).join('/') || '/';
		} catch {
			filename = 'remote-file';
			parentFolder = '/';
		}
	} else {
		const parts = path.split('/');
		filename = parts[parts.length - 1] || path;
		parentFolder = parts.slice(0, -1).join('/') || '/';
	}

	// Extract basename and extension
	const lastDot = filename.lastIndexOf('.');
	const basename = lastDot > 0 ? filename.substring(0, lastDot) : filename;
	const extension = lastDot > 0 ? filename.substring(lastDot + 1) : '';

	return {
		filename,
		basename,
		extension,
		fullPath: path,
		parentFolder,
		modifiedTime: fileStat?.mtime,
		createdTime: fileStat?.ctime,
		sizeInBytes: fileStat?.size,
	};
}

/**
 * Creates metadata for embedded code (no file source).
 *
 * @param title - Optional title to use as filename
 * @param language - Programming language
 * @returns Metadata object for embedded code
 */
export function createEmbeddedCodeMetadata(title: string | undefined, language: string): SourceFileMetadata {
	const displayName = title || 'inline';

	return {
		filename: displayName,
		basename: displayName,
		extension: language,
		fullPath: '',
		parentFolder: '',
	};
}
