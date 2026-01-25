/**
 * Ultra Code Fence - Renderers Index
 *
 * Re-exports all renderer functions for convenient importing.
 */

export type { CodeButtonOptions } from './buttons';

export {
	addCopyButton,
	addFoldButton,
	addCodeBlockButtons,
} from './buttons';

export type { TitleBarCreationOptions, TitleContainerOptions } from './title-bar';

export {
	createTitleBarElement,
	createDescriptionElement,
	createTooltipDescriptionElement,
	buildTitleContainer,
} from './title-bar';

export type { CodeBlockProcessingOptions } from './code-block';

export {
	processCodeBlock,
	countSourceLines,
	wrapPreElement,
	createCodeBlockProcessingOptions,
} from './code-block';

export type { CommandOutputRenderOptions } from './command-output';

export {
	renderCommandOutput,
	getCommandOutputStylesFromSettings,
	mergeCommandOutputStyles,
} from './command-output';
