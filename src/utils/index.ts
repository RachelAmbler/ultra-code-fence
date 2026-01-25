/**
 * Ultra Code Fence - Utilities Index
 *
 * Re-exports all utility functions for convenient importing.
 */

export {
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
