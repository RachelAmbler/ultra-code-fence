/**
 * Ultra Code Fence - Formatting Utilities
 *
 * Functions for formatting values into human-readable strings.
 * Includes file sizes, dates, and relative times.
 */

import type { TextCaseFormat, FileSizeFormat, DateDisplayFormat } from '../types';

// =============================================================================
// Case Formatting
// =============================================================================

/**
 * Applies case transformation to a string.
 *
 * @param value - String to transform
 * @param caseFormat - Case format to apply
 * @returns Transformed string
 *
 * @example
 * applyCaseFormat('hello world', 'upper')     // "HELLO WORLD"
 * applyCaseFormat('hello world', 'title')     // "Hello World"
 * applyCaseFormat('HELLO', 'capitalise')      // "Hello"
 */
export function applyCaseFormat(value: string, caseFormat: TextCaseFormat): string {
	switch (caseFormat) {
		case 'upper':
			return value.toUpperCase();

		case 'lower':
			return value.toLowerCase();

		case 'title':
			return value.replace(/\b\w/g, char => char.toUpperCase());

		case 'capitalise':
			return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

		default:
			return value;
	}
}

// =============================================================================
// Size Formatting
// =============================================================================

/**
 * Formats bytes into a human-readable size string.
 *
 * @param sizeInBytes - Size in bytes
 * @param sizeFormat - Output format (auto selects best unit)
 * @returns Formatted size string with unit
 *
 * @example
 * formatFileSize(1024)           // "1.0 KB"
 * formatFileSize(1024, 'bytes')  // "1024 B"
 * formatFileSize(1536, 'kb')     // "1.5 KB"
 */
export function formatFileSize(sizeInBytes: number, sizeFormat: FileSizeFormat = 'auto'): string {
	if (sizeInBytes === 0) return '0 B';

	switch (sizeFormat) {
		case 'bytes':
			return `${sizeInBytes} B`;

		case 'kb':
			return `${(sizeInBytes / 1024).toFixed(1)} KB`;

		case 'mb':
			return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;

		case 'gb':
			return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;

		case 'auto':
		default: {
			const units = ['B', 'KB', 'MB', 'GB'];
			const exponent = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
			const size = sizeInBytes / Math.pow(1024, exponent);
			const decimals = exponent > 0 ? 1 : 0;
			return `${size.toFixed(decimals)} ${units[exponent]}`;
		}
	}
}

// =============================================================================
// Date Formatting
// =============================================================================

/**
 * Calculates a relative time string from a timestamp.
 *
 * @param timestampMs - Unix timestamp in milliseconds
 * @returns Human-readable relative time (e.g., "2 hours ago")
 *
 * @example
 * calculateRelativeTime(Date.now() - 3600000)  // "1 hour ago"
 * calculateRelativeTime(Date.now() - 86400000) // "1 day ago"
 */
export function calculateRelativeTime(timestampMs: number): string {
	const now = Date.now();
	const differenceMs = now - timestampMs;

	const seconds = Math.floor(differenceMs / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const weeks = Math.floor(days / 7);
	const months = Math.floor(days / 30);
	const years = Math.floor(days / 365);

	if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
	if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
	if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
	if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
	if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
	if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

	return 'just now';
}

/**
 * Formats a timestamp into a readable date string.
 *
 * @param timestampMs - Unix timestamp in milliseconds
 * @param displayFormat - Output format
 * @returns Formatted date string
 *
 * @example
 * formatTimestamp(ts, 'short')     // "1/24/26"
 * formatTimestamp(ts, 'iso')       // "2026-01-24T10:30:00"
 * formatTimestamp(ts, 'relative')  // "2 hours ago"
 */
export function formatTimestamp(timestampMs: number, displayFormat: DateDisplayFormat = 'long'): string {
	if (!timestampMs) return 'N/A';

	const date = new Date(timestampMs);

	switch (displayFormat) {
		case 'short':
			return date.toLocaleDateString();

		case 'long':
			return date.toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});

		case 'iso':
			return date.toISOString().slice(0, 19);

		case 'date':
			return date.toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			});

		case 'time':
			return date.toLocaleTimeString(undefined, {
				hour: '2-digit',
				minute: '2-digit',
			});

		case 'relative':
			return calculateRelativeTime(timestampMs);

		default:
			return date.toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
	}
}

// =============================================================================
// HTML Escaping
// =============================================================================

/**
 * Escapes HTML special characters to prevent XSS.
 *
 * @param rawText - Raw text that may contain HTML characters
 * @returns Escaped text safe for innerHTML
 */
export function escapeHtml(rawText: string): string {
	return rawText
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

// =============================================================================
// Style Building
// =============================================================================

/**
 * Builds an inline style string from individual properties.
 *
 * @param colour - Text colour (empty string to omit)
 * @param isBold - Whether to apply bold
 * @param isItalic - Whether to apply italic
 * @returns CSS style string for inline use
 *
 * @example
 * buildStyleString('#ff0000', true, false)  // "color: #ff0000; font-weight: bold"
 * buildStyleString('', false, true)          // "font-style: italic"
 */
export function buildStyleString(colour: string, isBold: boolean, isItalic: boolean): string {
	const styleRules: string[] = [];

	if (colour) {
		styleRules.push(`color: ${colour}`);
	}

	if (isBold) {
		styleRules.push('font-weight: bold');
	}

	if (isItalic) {
		styleRules.push('font-style: italic');
	}

	return styleRules.join('; ');
}

// =============================================================================
// Callout Markdown Formatting
// =============================================================================

/**
 * Converts basic Markdown syntax to HTML for callout text.
 *
 * Supports: **bold**, *italic*, `code`, [text](url).
 * HTML is escaped first for safety, then Markdown is applied.
 *
 * @param text - Text with optional Markdown formatting
 * @returns HTML string safe for innerHTML
 *
 * @example
 * formatCalloutMarkdown('**bold** and *italic*')
 * // '<strong>bold</strong> and <em>italic</em>'
 */
export function formatCalloutMarkdown(text: string): string {
	if (!text) return '';

	// Escape HTML first to prevent XSS
	let html = escapeHtml(text);

	// Apply markdown formatting (order matters)
	// 1. Code: `text` → <code>text</code>
	html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

	// 2. Links: [text](url) → <a href="url">text</a>
	html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

	// 3. Bold: **text** → <strong>text</strong>
	html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

	// 4. Italic: *text* → <em>text</em> (after bold to avoid conflicts)
	html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

	return html;
}
