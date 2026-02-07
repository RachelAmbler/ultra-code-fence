/**
 * Ultra Code Fence - Default Settings
 *
 * Default values for all plugin settings. These are used when the plugin
 * is first installed or when a setting has not been explicitly configured.
 */

import type { PluginSettings } from '../types';

/**
 * Default plugin settings.
 *
 * These values represent sensible defaults that work well out of the box
 * while remaining unobtrusive. Users can customise any of these via the
 * settings tab.
 */
export const DEFAULT_SETTINGS: PluginSettings = {
	// Language support - common programming languages
	supportedLanguages: 'c,cpp,java,python,go,ruby,javascript,js,typescript,ts,shell,sh,bash,sql',

	// Title bar colours (used when useThemeColours is false)
	titleBarBackgroundColour: '#282c34',
	titleBarTextColour: '#abb2bf',

	// Title bar appearance
	defaultTitleBarStyle: 'tab',
	showFileIcon: true,
	fileIconStyle: 'emoji',
	customIconFolder: 'Assets/Icons',
	showLinkIndicator: true,

	// Code block features
	showCopyButton: true,

	// Fold/scroll: 0 = disabled, 1+ = enabled with N lines visible
	// FOLD takes precedence over SCROLL if both are non-zero
	foldLines: 0,
	scrollLines: 0,

	// Theme integration
	useThemeColours: true,

	// Title template
	defaultTitleTemplate: '{filename}',

	// Line formatting
	showLineNumbers: false,
	showZebraStripes: false,

	// Path handling
	defaultPathPrefix: 'vault://',

	// Version tracking
	lastSeenVersion: '',

	// Description styling
	descriptionDisplayMode: 'below',
	descriptionColour: '',
	descriptionItalic: true,

	// Embedded code support
	enableGenericProcessor: true,
	defaultLanguage: 'text',

	// Command output styling
	commandPromptColour: '#6b7280',
	commandPromptBold: false,
	commandPromptItalic: false,
	commandTextColour: '#98c379',
	commandTextBold: true,
	commandTextItalic: false,
	outputTextColour: '',
	outputTextBold: false,
	outputTextItalic: false,

	// Copy join defaults per language
	languageCopyJoinDefaults: {},

	// Download button
	showDownloadButton: true,
	downloadPathHistory: {},
};
