/**
 * Ultra Code Fence - Parsers Index
 *
 * Re-exports all parser functions for convenient importing.
 */

export {
	parseBlockContent,
	resolveBoolean,
	resolveNumber,
	resolveString,
	isValidRegex,
	createSafeRegex,
	parseNestedYamlConfig,
	parseLineRange,
	resolveBlockConfig,
	resolveCmdoutConfig,
	parseCalloutSection,
	resolveCalloutConfig,
	parsePresetYaml,
} from './yaml-parser';

export type {
	MarkerExtractionResult,
	MarkerExtractionOptions,
	LineRangeExtractionOptions,
	FilterChainResult,
} from './line-extractor';

export {
	extractBetweenMarkers,
	extractBetweenMarkersWithOptions,
	extractLines,
	extractLineRange,
	applyFilterChain,
	countLines,
	trimTrailingEmptyLines,
} from './line-extractor';
