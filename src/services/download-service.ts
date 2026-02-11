/**
 * Ultra Code Fence - Download Service
 *
 * Handles saving code block content to files using a Blob/anchor approach
 * that works on all platforms (desktop and mobile).
 */

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
 * Downloads code content to a file via Blob and anchor element.
 *
 * Creates a temporary download link and triggers a browser download.
 * Works on all platforms (desktop and mobile).
 *
 * @param codeText - The code content to save
 * @param suggestedFilename - Default filename for the download
 */
export function downloadCodeToFile(
	codeText: string,
	suggestedFilename: string,
): void {
	const blob = new Blob([codeText], { type: 'text/plain;charset=utf-8' });
	const url = URL.createObjectURL(blob);

	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = suggestedFilename;
	anchor.hidden = true;

	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);

	URL.revokeObjectURL(url);
}
