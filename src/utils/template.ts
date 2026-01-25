/**
 * Ultra Code Fence - Template Utilities
 *
 * Handles template variable substitution in title strings.
 * Supports variables like {filename}, {size:kb}, {modified:relative}.
 */

import type { SourceFileMetadata, TextCaseFormat, FileSizeFormat, DateDisplayFormat } from '../types';
import { applyCaseFormat, formatFileSize, formatTimestamp } from './formatting';

// =============================================================================
// Template Variable Parsing
// =============================================================================

/**
 * Parsed template variable with optional format modifier.
 */
interface ParsedTemplateVariable {
	/** Variable name (e.g., "filename", "size") */
	variableName: string;

	/** Optional format modifier (e.g., "upper", "kb") */
	formatModifier?: string;
}

/**
 * Parses a template variable string into its components.
 *
 * @param variableString - Variable string like "filename" or "filename:upper"
 * @returns Parsed variable and optional format
 *
 * @example
 * parseTemplateVariable("filename")       // { variableName: "filename" }
 * parseTemplateVariable("size:kb")        // { variableName: "size", formatModifier: "kb" }
 * parseTemplateVariable("modified:iso")   // { variableName: "modified", formatModifier: "iso" }
 */
function parseTemplateVariable(variableString: string): ParsedTemplateVariable {
	const colonIndex = variableString.indexOf(':');

	if (colonIndex === -1) {
		return { variableName: variableString.toLowerCase() };
	}

	return {
		variableName: variableString.substring(0, colonIndex).toLowerCase(),
		formatModifier: variableString.substring(colonIndex + 1).toLowerCase(),
	};
}

// =============================================================================
// Value Retrieval
// =============================================================================

/**
 * Text field names that support case formatting.
 */
const TEXT_FIELD_NAMES = ['filename', 'basename', 'extension', 'fullpath', 'parentfolder'] as const;

/**
 * Case formats supported by text fields.
 */
const SUPPORTED_CASE_FORMATS = ['upper', 'lower', 'title', 'capitalise'] as const;

/**
 * Gets a text field value with optional case formatting.
 */
function getTextFieldValue(
	metadata: SourceFileMetadata,
	fieldName: string,
	formatModifier?: string
): string | null {
	const fieldValues: Record<string, string> = {
		filename: metadata.filename,
		basename: metadata.basename,
		extension: metadata.extension,
		fullpath: metadata.fullPath,
		parentfolder: metadata.parentFolder,
	};

	if (!(fieldName in fieldValues)) {
		return null;
	}

	let value = fieldValues[fieldName];

	if (formatModifier && SUPPORTED_CASE_FORMATS.includes(formatModifier as typeof SUPPORTED_CASE_FORMATS[number])) {
		value = applyCaseFormat(value, formatModifier as TextCaseFormat);
	}

	return value;
}

/**
 * Gets the size field value with optional format.
 */
function getSizeFieldValue(metadata: SourceFileMetadata, formatModifier?: string): string | null {
	if (metadata.sizeInBytes === undefined) {
		return '';
	}

	const sizeFormat = (formatModifier || 'auto') as FileSizeFormat;
	return formatFileSize(metadata.sizeInBytes, sizeFormat);
}

/**
 * Gets a date field value with optional format.
 */
function getDateFieldValue(timestampMs: number | undefined, formatModifier?: string): string | null {
	if (timestampMs === undefined) {
		return '';
	}

	const dateFormat = (formatModifier || 'long') as DateDisplayFormat;
	return formatTimestamp(timestampMs, dateFormat);
}

/**
 * Gets the formatted value for a template variable.
 *
 * @param variableName - Variable name
 * @param formatModifier - Optional format modifier
 * @param metadata - File metadata to extract values from
 * @returns Formatted value, or original placeholder if unknown
 */
function resolveTemplateVariable(
	variableName: string,
	formatModifier: string | undefined,
	metadata: SourceFileMetadata
): string {
	// Check text fields first
	if (TEXT_FIELD_NAMES.includes(variableName as typeof TEXT_FIELD_NAMES[number])) {
		const value = getTextFieldValue(metadata, variableName, formatModifier);
		return value ?? '';
	}

	// Size field
	if (variableName === 'size') {
		return getSizeFieldValue(metadata, formatModifier) ?? '';
	}

	// Date fields
	if (variableName === 'modified') {
		return getDateFieldValue(metadata.modifiedTime, formatModifier) ?? '';
	}

	if (variableName === 'created') {
		return getDateFieldValue(metadata.createdTime, formatModifier) ?? '';
	}

	// Unknown variable - return as-is with braces
	return `{${variableName}${formatModifier ? ':' + formatModifier : ''}}`;
}

// =============================================================================
// Template Substitution
// =============================================================================

/**
 * Replaces template variables in a string with metadata values.
 *
 * Supported variables:
 *
 * Text fields (support case formats: upper, lower, title, capitalise):
 * - {filename}, {basename}, {extension}, {fullpath}, {parentfolder}
 *
 * Size field (formats: auto, bytes, kb, mb, gb):
 * - {size}, {size:kb}, {size:mb}
 *
 * Date fields (formats: short, long, iso, date, time, relative):
 * - {modified}, {modified:relative}, {created:iso}
 *
 * @param templateString - Template string with {variable} placeholders
 * @param metadata - File metadata to substitute
 * @returns String with variables replaced by values
 *
 * @example
 * replaceTemplateVariables("{filename:upper}", metadata)
 * // Returns: "HELPER.TS"
 *
 * @example
 * replaceTemplateVariables("{basename} - {size:kb}", metadata)
 * // Returns: "helper - 2.5 KB"
 *
 * @example
 * replaceTemplateVariables("Last modified {modified:relative}", metadata)
 * // Returns: "Last modified 2 hours ago"
 */
export function replaceTemplateVariables(templateString: string, metadata: SourceFileMetadata): string {
	// Match {variable} or {variable:format}
	return templateString.replace(/\{([^}]+)}/g, (match, variableString) => {
		const { variableName, formatModifier } = parseTemplateVariable(variableString);
		return resolveTemplateVariable(variableName, formatModifier, metadata);
	});
}

/**
 * Checks if a string contains template variables.
 *
 * @param templateString - String to check
 * @returns True if the string contains {variable} patterns
 */
export function containsTemplateVariables(templateString: string): boolean {
	return templateString.includes('{');
}
