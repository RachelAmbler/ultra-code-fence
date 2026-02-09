/**
 * Deep merge utility for ParsedYamlConfig objects
 *
 * Merges a base configuration with override values. Override takes precedence.
 * Handles nested objects and special cases like CALLOUT.ENTRIES.
 */

import type {
	ParsedYamlConfig,
} from '../types';

/**
 * Helper function to merge two sections of type T.
 * Override values take precedence. Undefined values in override fall through to base.
 *
 * @param base The base section
 * @param override The override section
 * @returns Merged section, or undefined if both are undefined
 */
function mergeSection<T>(
	base: T | undefined,
	override: T | undefined
): T | undefined {
	if (!base && !override) {
		return undefined;
	}

	if (!base) {
		return override;
	}

	if (!override) {
		return base;
	}

	// Both defined: merge property-by-property
	const baseRecord = base as Record<string, unknown>;
	const overrideRecord = override as Record<string, unknown>;
	const merged: Record<string, unknown> = { ...baseRecord };

	for (const key in overrideRecord) {
		const overrideValue = overrideRecord[key];
		if (overrideValue !== undefined) {
			merged[key] = overrideValue;
		}
	}

	return merged as T;
}

/**
 * Deep-merges two ParsedYamlConfig objects.
 * Override values take precedence over base values.
 * Undefined/missing properties in override fall through to base.
 *
 * Special handling:
 * - CALLOUT.ENTRIES: if override has ENTRIES, they replace base entirely
 * - Arrays: override replaces base (no element-wise merge)
 * - FILTER nested objects (BY_LINES, BY_MARKS): merge property-by-property
 * - RENDER_CMDOUT nested objects (PROMPT, COMMAND, OUTPUT): merge property-by-property
 *
 * @param base Base configuration (e.g., from preset)
 * @param override Override configuration (e.g., from block's YAML)
 * @returns Merged configuration with override taking precedence
 */
export function deepMergeYamlConfigs(
	base: ParsedYamlConfig,
	override: ParsedYamlConfig
): ParsedYamlConfig {
	// Handle empty cases
	if (!base || Object.keys(base).length === 0) {
		return override || {};
	}

	if (!override || Object.keys(override).length === 0) {
		return base || {};
	}

	const result: ParsedYamlConfig = {};

	// =========================================================================
	// META section
	// =========================================================================
	result.META = mergeSection(base.META, override.META);

	// =========================================================================
	// RENDER section
	// =========================================================================
	result.RENDER = mergeSection(base.RENDER, override.RENDER);

	// =========================================================================
	// FILTER section (has nested BY_LINES and BY_MARKS)
	// =========================================================================
	if (base.FILTER || override.FILTER) {
		const baseFILTER = base.FILTER;
		const overrideFILTER = override.FILTER;

		if (!baseFILTER) {
			result.FILTER = overrideFILTER;
		} else if (!overrideFILTER) {
			result.FILTER = baseFILTER;
		} else {
			// Both defined: merge BY_LINES and BY_MARKS separately
			result.FILTER = {};

			// Merge BY_LINES
			result.FILTER.BY_LINES = mergeSection(
				baseFILTER.BY_LINES,
				overrideFILTER.BY_LINES
			);

			// Merge BY_MARKS
			result.FILTER.BY_MARKS = mergeSection(
				baseFILTER.BY_MARKS,
				overrideFILTER.BY_MARKS
			);
		}
	}

	// =========================================================================
	// CALLOUT section (special: ENTRIES from override replaces base entirely)
	// =========================================================================
	if (base.CALLOUT || override.CALLOUT) {
		const baseCCALLOUT = base.CALLOUT;
		const overrideCALLOUT = override.CALLOUT;

		if (!baseCCALLOUT) {
			result.CALLOUT = overrideCALLOUT;
		} else if (!overrideCALLOUT) {
			result.CALLOUT = baseCCALLOUT;
		} else {
			// Both defined: merge DISPLAY, PRINT_DISPLAY, STYLE normally
			// but ENTRIES from override replaces base entirely
			result.CALLOUT = {};

			// Merge DISPLAY (override wins if defined)
			if (overrideCALLOUT.DISPLAY !== undefined) {
				result.CALLOUT.DISPLAY = overrideCALLOUT.DISPLAY;
			} else if (baseCCALLOUT.DISPLAY !== undefined) {
				result.CALLOUT.DISPLAY = baseCCALLOUT.DISPLAY;
			}

			// Merge PRINT_DISPLAY (override wins if defined)
			if (overrideCALLOUT.PRINT_DISPLAY !== undefined) {
				result.CALLOUT.PRINT_DISPLAY = overrideCALLOUT.PRINT_DISPLAY;
			} else if (baseCCALLOUT.PRINT_DISPLAY !== undefined) {
				result.CALLOUT.PRINT_DISPLAY = baseCCALLOUT.PRINT_DISPLAY;
			}

			// Merge STYLE (override wins if defined)
			if (overrideCALLOUT.STYLE !== undefined) {
				result.CALLOUT.STYLE = overrideCALLOUT.STYLE;
			} else if (baseCCALLOUT.STYLE !== undefined) {
				result.CALLOUT.STYLE = baseCCALLOUT.STYLE;
			}

			// ENTRIES: override replaces base entirely (if override has ENTRIES)
			if (overrideCALLOUT.ENTRIES !== undefined) {
				result.CALLOUT.ENTRIES = overrideCALLOUT.ENTRIES;
			} else if (baseCCALLOUT.ENTRIES !== undefined) {
				result.CALLOUT.ENTRIES = baseCCALLOUT.ENTRIES;
			}
		}
	}

	// =========================================================================
	// Top-level PROMPT
	// =========================================================================
	if (override.PROMPT !== undefined) {
		result.PROMPT = override.PROMPT;
	} else if (base.PROMPT !== undefined) {
		result.PROMPT = base.PROMPT;
	}

	// =========================================================================
	// RENDER_CMDOUT section (has nested PROMPT, COMMAND, OUTPUT)
	// =========================================================================
	if (base.RENDER_CMDOUT || override.RENDER_CMDOUT) {
		const baseRENDER_CMDOUT = base.RENDER_CMDOUT;
		const overrideRENDER_CMDOUT = override.RENDER_CMDOUT;

		if (!baseRENDER_CMDOUT) {
			result.RENDER_CMDOUT = overrideRENDER_CMDOUT;
		} else if (!overrideRENDER_CMDOUT) {
			result.RENDER_CMDOUT = baseRENDER_CMDOUT;
		} else {
			// Both defined: merge PROMPT, COMMAND, OUTPUT separately
			result.RENDER_CMDOUT = {};

			// Merge PROMPT
			result.RENDER_CMDOUT.PROMPT = mergeSection(
				baseRENDER_CMDOUT.PROMPT,
				overrideRENDER_CMDOUT.PROMPT
			);

			// Merge COMMAND
			result.RENDER_CMDOUT.COMMAND = mergeSection(
				baseRENDER_CMDOUT.COMMAND,
				overrideRENDER_CMDOUT.COMMAND
			);

			// Merge OUTPUT
			result.RENDER_CMDOUT.OUTPUT = mergeSection(
				baseRENDER_CMDOUT.OUTPUT,
				overrideRENDER_CMDOUT.OUTPUT
			);
		}
	}

	return result;
}
