/**
 * Ultra Code Fence - Services Index
 *
 * Re-exports all service functions for convenient importing.
 */

export {
	detectSourceLocationType,
	isRemotePath,
	isVaultPath,
	loadVaultFile,
	loadRemoteFile,
	loadSource,
	extractFileMetadata,
	createEmbeddedCodeMetadata,
} from './source-loader';

export type { IconCreationOptions } from './icon-generator';

export {
	generateFilledBadgeSvg,
	generateOutlineBadgeSvg,
	findCustomIconPath,
	getVaultResourceUrl,
	createIconElement,
	createIconFromSettings,
} from './icon-generator';

export {
	buildSuggestedFilename,
	downloadCodeToFile,
} from './download-service';
