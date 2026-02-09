/**
 * Shared test helper: creates a PluginSettings object with defaults.
 */
import type { PluginSettings } from '../../src/types';
import { DEFAULT_SETTINGS } from '../../src/constants';

export function testSettings(overrides?: Partial<PluginSettings>): PluginSettings {
	return { ...DEFAULT_SETTINGS, ...overrides };
}
