/**
 * Obsidian mock for unit testing.
 *
 * Provides a working parseYaml implementation using js-yaml,
 * which is what Obsidian uses internally.
 */

import yaml from 'js-yaml';

export function parseYaml(content: string): unknown {
	return yaml.load(content);
}
