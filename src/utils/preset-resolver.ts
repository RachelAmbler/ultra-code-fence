/**
 * Preset resolver for Ultra Code Fence
 *
 * Resolves presets and page-level config, merging them with block configuration.
 * Presets and page configs provide base configuration that can be overridden by
 * block-level settings.
 */

import type { ParsedYamlConfig } from '../types';
import { parsePresetYaml } from '../parsers/yaml-parser';
import { deepMergeYamlConfigs } from './config-merge';

/**
 * Resolves presets and page-level config, merging them with block configuration.
 *
 * Looks up the preset name from either the block's META.PRESET or the
 * page-level config's META.PRESET. Parses the preset YAML and deep-merges
 * it as the lowest layer, then page config, then block config on top.
 *
 * Priority (lowest → highest):
 *   named preset ← page config (ufence-ufence inline) ← block config
 *
 * @param blockConfig - Parsed YAML from the code block
 * @param presets - Map of preset names to raw YAML strings
 * @param pageConfig - Optional page-level config from a ufence-ufence block
 * @returns Merged configuration (or blockConfig unchanged if no preset/page config)
 */
export function resolvePreset(
	blockConfig: ParsedYamlConfig,
	presets: Record<string, string>,
	pageConfig?: ParsedYamlConfig
): ParsedYamlConfig {
	// 1. Determine preset name: block META.PRESET > page config META.PRESET
	const presetName = blockConfig.META?.PRESET ?? pageConfig?.META?.PRESET;

	// 2. Start building the merged result from the bottom up
	let result: ParsedYamlConfig = {};

	// Layer 1: Named preset (lowest priority base)
	if (presetName) {
		const presetYaml = presets[presetName];
		if (presetYaml) {
			result = parsePresetYaml(presetYaml);
		}
	}

	// Layer 2: Page-level inline config (middle priority)
	if (pageConfig) {
		// Strip META.PRESET from page config before merging (prevent cascading)
		let cleanPageConfig = pageConfig;
		if (pageConfig.META?.PRESET) {
			const { PRESET, ...restMeta } = pageConfig.META;
			cleanPageConfig = {
				...pageConfig,
				META: Object.keys(restMeta).length > 0 ? restMeta : undefined,
			};
		}
		result = deepMergeYamlConfigs(result, cleanPageConfig);
	}

	// Layer 3: Block-level config (highest priority)
	result = deepMergeYamlConfigs(result, blockConfig);

	// If nothing was merged (no preset and no page config), return blockConfig as-is
	if (!presetName && !pageConfig) {
		return blockConfig;
	}

	// Strip PRESET from final merged META (prevent cascading)
	if (result.META) {
		const { PRESET, ...restMeta } = result.META;
		result.META = Object.keys(restMeta).length > 0 ? restMeta : undefined;
	}

	return result;
}
