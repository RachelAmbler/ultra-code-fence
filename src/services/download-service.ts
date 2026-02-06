/**
 * Ultra Code Fence - Download Service
 *
 * Handles saving code block content to files. Uses Node.js fs and
 * Electron's dialog on desktop, with a Blob/anchor fallback on mobile.
 */

import { Platform } from 'obsidian';
import type { PluginSettings } from '../types';

/**
 * Builds a suggested filename from the resolved title and language.
 *
 * If a title is set, uses it as the base name. Appends the language
 * as an extension if the title doesn't already have one.
 * Falls back to `code.{lang}` if no title is provided.
 *
 * @param resolvedTitle - The resolved title text (after template substitution), or empty string
 * @param language - The language identifier from the ufence block
 * @returns Sanitised filename suggestion
 */
export function buildSuggestedFilename(resolvedTitle: string, language: string): string {
	const ext = language || 'txt';

	if (resolvedTitle) {
		// Sanitise: remove characters invalid in filenames
		const sanitised = resolvedTitle.replace(/[<>:"/\\|?*]/g, '_').trim();

		// Check if the title already has a file extension
		if (/\.\w+$/.test(sanitised)) {
			return sanitised;
		}

		return `${sanitised}.${ext}`;
	}

	return `code.${ext}`;
}

/**
 * Downloads code content to a file.
 *
 * On desktop: shows a native OS save dialog via Electron, writes with Node's fs,
 * and remembers the chosen directory per note path.
 *
 * On mobile: creates a Blob and triggers a browser download.
 *
 * @param codeText - The code content to save
 * @param suggestedFilename - Default filename for the save dialog
 * @param notePath - Path of the containing note (for remembering save directory)
 * @param settings - Plugin settings
 * @param saveSettings - Callback to persist settings changes
 */
export async function downloadCodeToFile(
	codeText: string,
	suggestedFilename: string,
	notePath: string,
	settings: PluginSettings,
	saveSettings: () => Promise<void>
): Promise<void> {
	if (Platform.isDesktopApp) {
		try {
			await downloadDesktop(codeText, suggestedFilename, notePath, settings, saveSettings);
			return;
		} catch {
			// Electron APIs unavailable — fall through to mobile/HTML5 approach
		}
	}

	downloadMobile(codeText, suggestedFilename);
}

/**
 * Desktop download via Electron's native save dialog and Node's fs.
 */
async function downloadDesktop(
	codeText: string,
	suggestedFilename: string,
	notePath: string,
	settings: PluginSettings,
	saveSettings: () => Promise<void>
): Promise<void> {
	// Dynamic requires for Node/Electron modules
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const fs = require('fs') as typeof import('fs');
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const path = require('path') as typeof import('path');
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { remote } = require('electron');

	// Build default path from remembered directory + suggested filename
	const lastDir = settings.downloadPathHistory[notePath] || '';
	const defaultPath = lastDir
		? path.join(lastDir, suggestedFilename)
		: suggestedFilename;

	const result = await remote.dialog.showSaveDialog({
		defaultPath,
		filters: [
			{ name: 'All Files', extensions: ['*'] },
		],
	});

	if (result.canceled || !result.filePath) {
		return;
	}

	// Write the file
	fs.writeFileSync(result.filePath, codeText, 'utf-8');

	// Remember the directory for this note
	settings.downloadPathHistory[notePath] = path.dirname(result.filePath);
	await saveSettings();
}

/**
 * Mobile/fallback download via Blob and anchor element.
 */
function downloadMobile(codeText: string, suggestedFilename: string): void {
	const blob = new Blob([codeText], { type: 'text/plain;charset=utf-8' });
	const url = URL.createObjectURL(blob);

	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = suggestedFilename;
	anchor.style.display = 'none';

	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);

	URL.revokeObjectURL(url);
}
