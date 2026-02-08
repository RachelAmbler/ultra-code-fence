/**
 * Ultra Code Fence - YAML Syntax Highlighter
 *
 * Pure function that takes a YAML string and returns an HTML string
 * with <span> tags for syntax colouring. Used by the YAML editor
 * component in the Presets settings tab.
 *
 * No DOM dependency — purely string-in, string-out.
 */

// =============================================================================
// Constants
// =============================================================================

const CSS = {
	key: 'ucf-yaml-key',
	string: 'ucf-yaml-string',
	value: 'ucf-yaml-value',
	comment: 'ucf-yaml-comment',
	punctuation: 'ucf-yaml-punctuation',
} as const;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Escapes HTML special characters so raw YAML doesn't break the <pre>.
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

/**
 * Wraps text in a <span> with the given CSS class.
 */
function span(cls: string, text: string): string {
	return `<span class="${cls}">${text}</span>`;
}

// =============================================================================
// Main Highlighter
// =============================================================================

/**
 * Highlights a YAML string, returning HTML with syntax-coloured spans.
 *
 * Processes line-by-line with regex matching for:
 * - Comments (# ...)
 * - Keys (word before colon)
 * - Quoted strings ("..." or '...')
 * - Boolean and numeric values
 * - List item dashes
 * - Colons as punctuation
 *
 * @param yaml - Raw YAML string
 * @returns HTML string with <span> tags for each token type
 */
export function highlightYaml(yaml: string): string {
	if (!yaml) return '';

	const lines = yaml.split('\n');
	const highlighted = lines.map(highlightLine);
	return highlighted.join('\n');
}

/**
 * Highlights a single YAML line.
 */
function highlightLine(line: string): string {
	// Blank line — preserve as-is
	if (line.trim() === '') return escapeHtml(line);

	// Full-line comment
	if (/^\s*#/.test(line)) {
		return span(CSS.comment, escapeHtml(line));
	}

	// List item line:  "  - value" or "  - KEY: value"
	const listMatch = line.match(/^(\s*)(- )(.*)/);
	if (listMatch) {
		const [, indent, dash, rest] = listMatch;
		return escapeHtml(indent) + span(CSS.punctuation, escapeHtml(dash)) + highlightValueOrKeyValue(rest);
	}

	// Key-value line:  "KEY: value" or "  KEY: value"
	const kvMatch = line.match(/^(\s*)([\w][\w\s]*?)(\s*:\s*)(.*)/);
	if (kvMatch) {
		const [, indent, key, colon, value] = kvMatch;
		const escapedIndent = escapeHtml(indent);
		const escapedKey = span(CSS.key, escapeHtml(key));
		const escapedColon = span(CSS.punctuation, escapeHtml(colon));
		const highlightedValue = highlightValue(value);
		return escapedIndent + escapedKey + escapedColon + highlightedValue;
	}

	// Fallback — just escape
	return escapeHtml(line);
}

/**
 * Highlights a value portion that might itself be "KEY: value" (after a list dash).
 */
function highlightValueOrKeyValue(text: string): string {
	// Check if it's a nested key-value after the dash
	const kvMatch = text.match(/^([\w][\w\s]*?)(\s*:\s*)(.*)/);
	if (kvMatch) {
		const [, key, colon, value] = kvMatch;
		return span(CSS.key, escapeHtml(key)) + span(CSS.punctuation, escapeHtml(colon)) + highlightValue(value);
	}
	return highlightValue(text);
}

/**
 * Highlights a YAML value (the part after the colon).
 */
function highlightValue(value: string): string {
	const trimmed = value.trim();

	if (trimmed === '') return escapeHtml(value);

	// Inline comment at end of value
	const commentIdx = findInlineComment(value);
	if (commentIdx >= 0) {
		const valuePart = value.substring(0, commentIdx);
		const commentPart = value.substring(commentIdx);
		return highlightValue(valuePart) + span(CSS.comment, escapeHtml(commentPart));
	}

	// Double-quoted string
	if (/^\s*".*"/.test(value)) {
		return span(CSS.string, escapeHtml(value));
	}

	// Single-quoted string
	if (/^\s*'.*'/.test(value)) {
		return span(CSS.string, escapeHtml(value));
	}

	// Boolean
	if (/^\s*(true|false|yes|no|on|off)\s*$/i.test(value)) {
		return span(CSS.value, escapeHtml(value));
	}

	// Numeric (integer or float)
	if (/^\s*-?\d+(\.\d+)?\s*$/.test(value)) {
		return span(CSS.value, escapeHtml(value));
	}

	// Null
	if (/^\s*(null|~)\s*$/i.test(value)) {
		return span(CSS.value, escapeHtml(value));
	}

	// Array shorthand [...]
	if (/^\s*\[.*\]\s*$/.test(value)) {
		return span(CSS.value, escapeHtml(value));
	}

	// Unquoted string value
	return span(CSS.string, escapeHtml(value));
}

/**
 * Finds the index of an inline comment (# not inside quotes).
 * Returns -1 if no inline comment found.
 */
function findInlineComment(value: string): number {
	let inDouble = false;
	let inSingle = false;

	for (let i = 0; i < value.length; i++) {
		const ch = value[i];
		if (ch === '"' && !inSingle) inDouble = !inDouble;
		if (ch === "'" && !inDouble) inSingle = !inSingle;
		if (ch === '#' && !inDouble && !inSingle && i > 0 && value[i - 1] === ' ') {
			return i;
		}
	}
	return -1;
}
