/**
 * Ultra Code Fence - Line Extractor
 *
 * Extracts specific portions of source code based on line numbers
 * or marker strings. Used to embed only relevant sections of larger
 * source files.
 */

import type { ResolvedBlockConfig } from '../types';

// =============================================================================
// Marker-Based Extraction
// =============================================================================

/**
 * Result of a marker-based extraction operation.
 */
export interface MarkerExtractionResult {
	/** Extracted content, or null if extraction failed */
	content: string | null;

	/** Error message if extraction failed, null on success */
	error: string | null;
}

/**
 * Options for marker-based extraction.
 */
export interface MarkerExtractionOptions {
	/** Include the marker lines in output (default: false for backward compat with legacy function) */
	inclusive?: boolean;
}

/**
 * Extracts content between two marker strings in source code.
 *
 * Markers are typically comments in the source file that define a region.
 * By default, the marker lines are excluded (for backward compatibility).
 * Set inclusive: true to include the marker lines in the output.
 *
 * @param sourceCode - Complete source code to extract from
 * @param startMarker - Start marker string to search for
 * @param endMarker - End marker string to search for
 * @param options - Extraction options (inclusive flag)
 * @returns Object containing extracted content or error message
 *
 * @example
 * // With inclusive: false (default)
 * // Source: "// BEGIN\ncode\n// END"
 * // Result: "code"
 *
 * // With inclusive: true
 * // Source: "// BEGIN\ncode\n// END"
 * // Result: "// BEGIN\ncode\n// END"
 */
export function extractBetweenMarkersWithOptions(
	sourceCode: string,
	startMarker: string,
	endMarker: string,
	options: MarkerExtractionOptions = {}
): MarkerExtractionResult {
	const { inclusive = false } = options;

	if (!startMarker || !endMarker) {
		return { content: null, error: 'Both start and end markers must be non-empty' };
	}

	const lines = sourceCode.split('\n');
	let startIndex = -1;
	let endIndex = -1;

	// Find the lines containing the markers
	for (let i = 0; i < lines.length; i++) {
		if (startIndex === -1 && lines[i].includes(startMarker)) {
			startIndex = i;
		} else if (startIndex !== -1 && lines[i].includes(endMarker)) {
			endIndex = i;
			break;
		}
	}

	if (startIndex === -1) {
		return { content: null, error: `Start marker "${startMarker}" not found in file` };
	}

	if (endIndex === -1) {
		return { content: null, error: `End marker "${endMarker}" not found after start marker` };
	}

	// Extract lines based on inclusive flag
	const extractedLines = inclusive
		? lines.slice(startIndex, endIndex + 1)  // Include marker lines
		: lines.slice(startIndex + 1, endIndex); // Exclude marker lines

	// Only trim blank lines if not inclusive (preserve marker lines exactly)
	if (!inclusive) {
		// Trim leading blank lines
		while (extractedLines.length > 0 && extractedLines[0].trim() === '') {
			extractedLines.shift();
		}

		// Trim trailing blank lines
		while (extractedLines.length > 0 && extractedLines[extractedLines.length - 1].trim() === '') {
			extractedLines.pop();
		}
	}

	return { content: extractedLines.join('\n'), error: null };
}

// =============================================================================
// Line Number Extraction
// =============================================================================

/**
 * Extracts specific lines from source code based on a line specification.
 *
 * Supports multiple formats:
 * - Single lines: "5" extracts line 5
 * - Multiple lines: "1,5,10" extracts lines 1, 5, and 10
 * - Ranges: "5-10" extracts lines 5 through 10 inclusive
 * - Mixed: "1,5-10,15" combines all above
 *
 * When extracting non-contiguous lines, adds "..." separators between
 * sections to indicate skipped content.
 *
 * @param sourceCode - Complete source code to extract from
 * @param linesSpec - Line specification string (e.g., "2,9,30-40,100-122,150")
 * @returns Extracted lines with "..." separators between non-contiguous sections
 *
 * @example
 * extractLines(code, "1-5")     // Lines 1 through 5
 * extractLines(code, "1,10")    // Lines 1 and 10 with "..." between
 * extractLines(code, "1-3,8-10") // Lines 1-3, then "...", then 8-10
 */
export function extractLines(sourceCode: string, linesSpec: string): string {
	if (!linesSpec?.trim()) {
		return sourceCode;
	}

	const lineNumbers = parseLineSpec(linesSpec);

	if (lineNumbers.length === 0) {
		return sourceCode;
	}

	const lines = sourceCode.split('\n');
	const resultLines: string[] = [];

	// Sort and deduplicate line numbers
	const sortedLines = [...new Set(lineNumbers)].sort((a, b) => a - b);

	let lastLineNum = -1;

	for (const lineNum of sortedLines) {
		const index = lineNum - 1; // Convert to 0-based index

		if (index >= 0 && index < lines.length) {
			// Add separator if there's a gap in line numbers
			if (lastLineNum !== -1 && lineNum > lastLineNum + 1) {
				resultLines.push('...');
			}

			resultLines.push(lines[index]);
			lastLineNum = lineNum;
		}
	}

	return resultLines.join('\n');
}

/**
 * Parses a line specification string into an array of line numbers.
 *
 * @param spec - Line specification (e.g., "1,5-10,15")
 * @returns Array of individual line numbers
 */
export function parseLineSpec(spec: string): number[] {
	const lineNumbers: number[] = [];
	const parts = spec.split(',');

	for (const part of parts) {
		const trimmed = part.trim();

		if (trimmed.includes('-')) {
			// Range format: "5-10"
			const rangeParts = trimmed.split('-');

			if (rangeParts.length === 2) {
				const start = parseInt(rangeParts[0].trim(), 10);
				const end = parseInt(rangeParts[1].trim(), 10);

				if (!isNaN(start) && !isNaN(end) && start <= end) {
					for (let i = start; i <= end; i++) {
						lineNumbers.push(i);
					}
				}
			}
		} else {
			// Single line number
			const lineNum = parseInt(trimmed, 10);

			if (!isNaN(lineNum)) {
				lineNumbers.push(lineNum);
			}
		}
	}

	return lineNumbers;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Counts the number of lines in a string.
 *
 * @param content - Text content
 * @returns Number of lines
 */
export function countLines(content: string): number {
	if (!content) return 0;
	return content.split('\n').length;
}

/**
 * Removes trailing empty lines from content.
 *
 * @param lines - Array of lines
 * @returns Array with trailing empty lines removed
 */
export function trimTrailingEmptyLines(lines: string[]): string[] {
	const result = [...lines];

	while (result.length > 0 && result[result.length - 1] === '') {
		result.pop();
	}

	return result;
}

// =============================================================================
// Line Range Extraction (for nested YAML FILTER.BY_LINES)
// =============================================================================

/**
 * Options for line range extraction.
 */
export interface LineRangeExtractionOptions {
	/** Include boundary lines (default: true) */
	inclusive?: boolean;
}

/**
 * Extracts a contiguous range of lines from source code.
 *
 * Unlike extractLines() which handles complex specs with gaps,
 * this function extracts a simple start-to-end range.
 *
 * @param sourceCode - Complete source code to extract from
 * @param startLine - Start line number (1-based)
 * @param endLine - End line number (1-based)
 * @param options - Extraction options
 * @returns Extracted lines as a string
 *
 * @example
 * // With inclusive: true (default)
 * // extractLineRange(code, 10, 20) returns lines 10-20
 *
 * // With inclusive: false
 * // extractLineRange(code, 10, 20, { inclusive: false }) returns lines 11-19
 */
export function extractLineRange(
	sourceCode: string,
	startLine: number,
	endLine: number,
	options: LineRangeExtractionOptions = {}
): string {
	const { inclusive = true } = options;
	const lines = sourceCode.split('\n');

	// Convert to 0-based indices
	let startIndex = startLine - 1;
	let endIndex = endLine - 1;

	// Adjust for non-inclusive extraction
	if (!inclusive) {
		startIndex += 1;
		endIndex -= 1;
	}

	// Validate range
	if (startIndex < 0) startIndex = 0;
	if (endIndex >= lines.length) endIndex = lines.length - 1;
	if (startIndex > endIndex) {
		return ''; // Invalid range after adjustment
	}

	return lines.slice(startIndex, endIndex + 1).join('\n');
}

// =============================================================================
// Filter Chain (for nested YAML FILTER section)
// =============================================================================

/**
 * Result of applying a filter chain.
 */
export interface FilterChainResult {
	/** Filtered content */
	content: string;

	/** Error message if filtering failed, null on success */
	error: string | null;
}

/**
 * Applies the filter chain: BY_LINES first, then BY_MARKS on the result.
 *
 * This implements the nested YAML FILTER section processing where:
 * 1. FILTER.BY_LINES extracts a line range (if enabled)
 * 2. FILTER.BY_MARKS extracts between markers (if enabled) from the result of step 1
 *
 * @param sourceCode - Original source code
 * @param config - Resolved block configuration with filter settings
 * @returns Filtered content or error
 *
 * @example
 * // Config with both filters:
 * // FILTER:
 * //   BY_LINES:
 * //     RANGE: 10, 100
 * //   BY_MARKS:
 * //     START: "// BEGIN"
 * //     END: "// END"
 * //
 * // First extracts lines 10-100, then finds markers within that subset
 */
export function applyFilterChain(
	sourceCode: string,
	config: ResolvedBlockConfig
): FilterChainResult {
	let content = sourceCode;

	// Step 1: Apply BY_LINES filter first
	if (config.filterByLines.enabled) {
		content = extractLineRange(
			content,
			config.filterByLines.start,
			config.filterByLines.end,
			{ inclusive: config.filterByLines.inclusive }
		);
	}

	// Step 2: Apply BY_MARKS filter on the result
	if (config.filterByMarks.enabled) {
		const result = extractBetweenMarkersWithOptions(
			content,
			config.filterByMarks.startMarker,
			config.filterByMarks.endMarker,
			{ inclusive: config.filterByMarks.inclusive }
		);

		if (result.error) {
			return { content: '', error: result.error };
		}

		content = result.content ?? '';
	}

	return { content, error: null };
}
