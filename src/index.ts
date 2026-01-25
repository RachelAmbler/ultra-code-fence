/**
 * Ultra Code Fence - Module Index
 *
 * Main entry point that re-exports the plugin class.
 * All other modules can be imported from their respective directories.
 */

export { default } from './main';

// Re-export types for external use
export type {
	PluginSettings,
	TitleBarStyle,
	FileIconStyle,
	DescriptionDisplayMode,
	SourceFileMetadata,
	ParsedBlockContent,
	ResolvedDisplayOptions,
	ReleaseNotesData,
	ChangelogItem,
	CommandOutputStyles,
} from './types';

// Re-export constants for extension
export { DEFAULT_SETTINGS } from './constants';
