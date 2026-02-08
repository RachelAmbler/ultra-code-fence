/**
 * Ultra Code Fence - Utilities Index
 *
 * Re-exports all utility functions for convenient importing.
 */

export {
	formatCalloutMarkdown,
	applyCaseFormat,
	formatFileSize,
	calculateRelativeTime,
	formatTimestamp,
	escapeHtml,
	buildStyleString,
} from './formatting';

export {
	replaceTemplateVariables,
	containsTemplateVariables,
} from './template';

export type { LineWrappingOptions } from './dom';

export {
	addScrollBehaviour,
	wrapCodeLinesInDom,
	processCodeElementLines,
	findCodeElement,
	findPreElement,
	removeExistingTitleElements,
	createCodeBlockContainer,
	extractCodeText,
} from './dom';

export {
	groupCalloutsByLine,
	buildInlineCalloutHTML,
	buildFootnoteRefHTML,
	buildFootnoteEntryHTML,
	buildFootnoteSectionHTML,
	buildPopoverTriggerHTML,
	buildPopoverContentHTML,
	shouldReplaceLine,
	filterByDisplayMode,
} from './callout-processor';

export { deepMergeYamlConfigs } from './config-merge';

export { resolvePreset } from './preset-resolver';
