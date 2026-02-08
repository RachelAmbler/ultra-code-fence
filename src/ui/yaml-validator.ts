/**
 * Ultra Code Fence - YAML Schema Validator
 *
 * Validates that a parsed YAML object contains only recognised keys
 * from the Ultra Code Fence configuration schema. This catches typos
 * like "NUMBER: true" (should be "LINES: true") that are valid YAML
 * but not valid plugin configuration.
 *
 * Uses the canonical key constants from src/constants/patterns.ts
 * as the single source of truth.
 */

import {
	YAML_SECTIONS,
	YAML_META,
	YAML_RENDER_DISPLAY,
	YAML_FILTER,
	YAML_FILTER_BY_LINES,
	YAML_FILTER_BY_MARKS,
	YAML_CALLOUT,
	YAML_CALLOUT_ENTRY,
} from '../constants';

// =============================================================================
// Schema — built from the canonical constants
// =============================================================================

/** Set of recognised top-level section names. */
const VALID_SECTIONS: Set<string> = new Set(Object.values(YAML_SECTIONS));

/** Recognised keys within each section. */
const SECTION_KEYS: Record<string, Set<string>> = {
	[YAML_SECTIONS.meta]: new Set<string>(Object.values(YAML_META)),
	[YAML_SECTIONS.render]: new Set<string>(Object.values(YAML_RENDER_DISPLAY)),
	[YAML_SECTIONS.filter]: new Set<string>(Object.values(YAML_FILTER)),
	[YAML_SECTIONS.callout]: new Set<string>(Object.values(YAML_CALLOUT)),
};

/** Recognised keys within FILTER subsections. */
const FILTER_SUB_KEYS: Record<string, Set<string>> = {
	[YAML_FILTER.byLines]: new Set<string>(Object.values(YAML_FILTER_BY_LINES)),
	[YAML_FILTER.byMarks]: new Set<string>(Object.values(YAML_FILTER_BY_MARKS)),
};

/** Recognised keys within CALLOUT.ENTRIES items. */
const CALLOUT_ENTRY_KEYS: Set<string> = new Set(Object.values(YAML_CALLOUT_ENTRY));

// =============================================================================
// Validation
// =============================================================================

/**
 * A single validation warning (not a hard error — the YAML is parseable
 * but contains an unrecognised key).
 */
export interface YamlWarning {
	/** Path to the problematic key, e.g. "RENDER.NUMBER" */
	path: string;
	/** The unrecognised key name */
	key: string;
}

/**
 * Validates a parsed YAML object against the UCF configuration schema.
 *
 * Returns an array of warnings for unrecognised keys. An empty array
 * means everything is valid (or the input is empty/non-object).
 *
 * @param parsed - The parsed YAML object (from `parseYaml()`)
 * @returns Array of warnings for unrecognised keys
 */
export function validateYamlSchema(parsed: unknown): YamlWarning[] {
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		return [];
	}

	const warnings: YamlWarning[] = [];
	const obj = parsed as Record<string, unknown>;

	for (const key of Object.keys(obj)) {
		if (!VALID_SECTIONS.has(key)) {
			warnings.push({ path: key, key });
			continue;
		}

		const sectionValue = obj[key];
		if (!sectionValue || typeof sectionValue !== 'object' || Array.isArray(sectionValue)) {
			continue;
		}

		const sectionObj = sectionValue as Record<string, unknown>;
		const validKeys = SECTION_KEYS[key];

		if (!validKeys) continue;

		for (const subKey of Object.keys(sectionObj)) {
			if (!validKeys.has(subKey)) {
				warnings.push({ path: `${key}.${subKey}`, key: subKey });
				continue;
			}

			// Validate deeper nesting for FILTER subsections
			if (key === YAML_SECTIONS.filter && FILTER_SUB_KEYS[subKey]) {
				const filterSub = sectionObj[subKey];
				if (filterSub && typeof filterSub === 'object' && !Array.isArray(filterSub)) {
					const filterSubObj = filterSub as Record<string, unknown>;
					const validSubKeys = FILTER_SUB_KEYS[subKey];
					for (const filterKey of Object.keys(filterSubObj)) {
						if (!validSubKeys.has(filterKey)) {
							warnings.push({ path: `${key}.${subKey}.${filterKey}`, key: filterKey });
						}
					}
				}
			}

			// Validate CALLOUT.ENTRIES items
			if (key === YAML_SECTIONS.callout && subKey === YAML_CALLOUT.entries) {
				const entries = sectionObj[subKey];
				if (Array.isArray(entries)) {
					for (let i = 0; i < entries.length; i++) {
						const entry = entries[i];
						if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
							const entryObj = entry as Record<string, unknown>;
							for (const entryKey of Object.keys(entryObj)) {
								if (!CALLOUT_ENTRY_KEYS.has(entryKey)) {
									warnings.push({
										path: `${key}.${subKey}[${i}].${entryKey}`,
										key: entryKey,
									});
								}
							}
						}
					}
				}
			}
		}
	}

	return warnings;
}

/**
 * Formats validation warnings into a human-readable string.
 *
 * @param warnings - Array of validation warnings
 * @returns Formatted string, e.g. "Unknown key: RENDER.NUMBER"
 */
export function formatWarnings(warnings: YamlWarning[]): string {
	if (warnings.length === 0) return '';
	if (warnings.length === 1) {
		return `Unknown key: ${warnings[0].path}`;
	}
	const keys = warnings.map(w => w.path).join(', ');
	return `Unknown keys: ${keys}`;
}
