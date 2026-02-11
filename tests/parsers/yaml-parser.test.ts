import { describe, it, expect } from 'vitest';
import {
	resolveBoolean,
	resolveNumber,
	resolveString,
	isValidRegex,
	createSafeRegex,
	parseMetaSection,
	parseRenderDisplaySection,
	parseLineRange,
	parseFilterSection,
	parseRenderCmdoutSection,
	parseBlockContent,
	parseNestedYamlConfig,
	resolveBlockConfig,
	resolveCmdoutConfig,
} from '../../src/parsers/yaml-parser';
import type { ParsedYamlConfig } from '../../src/types';
import { testSettings } from '../helpers/test-settings';

// =============================================================================
// Value Resolution
// =============================================================================

describe('resolveBoolean', () => {
	it('returns default when value is undefined', () => {
		expect(resolveBoolean(undefined, true)).toBe(true);
		expect(resolveBoolean(undefined, false)).toBe(false);
	});

	it('returns true for boolean true', () => {
		expect(resolveBoolean(true, false)).toBe(true);
	});

	it('returns false for boolean false', () => {
		expect(resolveBoolean(false, true)).toBe(false);
	});

	it('returns true for string "true"', () => {
		expect(resolveBoolean('true', false)).toBe(true);
	});

	it('returns false for string "false"', () => {
		expect(resolveBoolean('false', true)).toBe(false);
	});

	it('is case-sensitive — "True" and "TRUE" return false', () => {
		expect(resolveBoolean('True', true)).toBe(false);
		expect(resolveBoolean('TRUE', true)).toBe(false);
		expect(resolveBoolean('FALSE', false)).toBe(false);
	});

	it('returns false for non-boolean values', () => {
		expect(resolveBoolean(1, true)).toBe(false);
		expect(resolveBoolean(0, true)).toBe(false);
		expect(resolveBoolean('yes', true)).toBe(false);
		expect(resolveBoolean('no', false)).toBe(false);
		expect(resolveBoolean({}, true)).toBe(false);
		expect(resolveBoolean([], true)).toBe(false);
		expect(resolveBoolean(null, true)).toBe(false);
		expect(resolveBoolean('', true)).toBe(false);
	});
});

describe('resolveNumber', () => {
	it('returns default when value is undefined', () => {
		expect(resolveNumber(undefined, 42)).toBe(42);
		expect(resolveNumber(undefined, 0)).toBe(0);
	});

	it('returns number as-is', () => {
		expect(resolveNumber(123, 0)).toBe(123);
		expect(resolveNumber(0, 10)).toBe(0);
		expect(resolveNumber(-42, 0)).toBe(-42);
	});

	it('parses numeric strings', () => {
		expect(resolveNumber('789', 0)).toBe(789);
		expect(resolveNumber('0', 10)).toBe(0);
		expect(resolveNumber('-100', 0)).toBe(-100);
	});

	it('truncates float strings via parseInt', () => {
		expect(resolveNumber('3.14', 0)).toBe(3);
		expect(resolveNumber('99.999', 0)).toBe(99);
	});

	it('returns default for non-numeric strings', () => {
		expect(resolveNumber('abc', 99)).toBe(99);
		expect(resolveNumber('', 50)).toBe(50);
	});

	it('parses leading digits from mixed strings', () => {
		// parseInt("12abc") returns 12
		expect(resolveNumber('12abc', 0)).toBe(12);
	});

	it('returns default for NaN', () => {
		expect(resolveNumber(NaN, 42)).toBe(42);
	});

	it('returns default for booleans (parseInt fails)', () => {
		// parseInt('true') and parseInt('false') both return NaN
		expect(resolveNumber(true, 7)).toBe(7);
		expect(resolveNumber(false, 8)).toBe(8);
	});

	it('returns default for null and objects', () => {
		expect(resolveNumber(null, 5)).toBe(5);
		expect(resolveNumber({}, 10)).toBe(10);
	});
});

describe('resolveString', () => {
	it('returns default when value is undefined', () => {
		expect(resolveString(undefined, 'fallback')).toBe('fallback');
	});

	it('returns default when value is null', () => {
		expect(resolveString(null, 'fallback')).toBe('fallback');
	});

	it('returns string as-is', () => {
		expect(resolveString('hello', '')).toBe('hello');
		expect(resolveString('path/to/file.ts', '')).toBe('path/to/file.ts');
	});

	it('returns empty string (not default) for empty string input', () => {
		expect(resolveString('', 'fallback')).toBe('');
	});

	it('converts numbers to strings', () => {
		expect(resolveString(42, '')).toBe('42');
		expect(resolveString(3.14, '')).toBe('3.14');
		expect(resolveString(0, '')).toBe('0');
	});

	it('converts booleans to strings', () => {
		expect(resolveString(true, '')).toBe('true');
		expect(resolveString(false, '')).toBe('false');
	});

	it('returns default for objects and arrays instead of [object Object]', () => {
		expect(resolveString({}, '')).toBe('');
		expect(resolveString({}, 'fallback')).toBe('fallback');
		expect(resolveString([], '')).toBe('');
		expect(resolveString([1, 2, 3], '')).toBe('');
	});
});

// =============================================================================
// Validation
// =============================================================================

describe('isValidRegex', () => {
	it('returns true for valid patterns', () => {
		expect(isValidRegex('test')).toBe(true);
		expect(isValidRegex('^hello.*world$')).toBe(true);
		expect(isValidRegex('[a-z0-9]+')).toBe(true);
		expect(isValidRegex('(foo|bar)')).toBe(true);
		expect(isValidRegex('\\d+\\.\\d+')).toBe(true);
		expect(isValidRegex('^\\s*#')).toBe(true);
	});

	it('returns true for empty string (matches everything)', () => {
		expect(isValidRegex('')).toBe(true);
	});

	it('returns false for invalid patterns', () => {
		expect(isValidRegex('[unclosed')).toBe(false);
		expect(isValidRegex('*invalid')).toBe(false);
		expect(isValidRegex('(?P<named>)')).toBe(false);
	});
});

describe('createSafeRegex', () => {
	it('returns RegExp instance for valid patterns', () => {
		const regex = createSafeRegex('^\\d+$');
		expect(regex).toBeInstanceOf(RegExp);
		expect(regex!.test('123')).toBe(true);
		expect(regex!.test('abc')).toBe(false);
	});

	it('returns working regex for prompt patterns', () => {
		const regex = createSafeRegex('^(\\$ )(.*)');
		expect(regex).not.toBeNull();
		const match = '$ whoami'.match(regex!);
		expect(match).not.toBeNull();
		expect(match![1]).toBe('$ ');
		expect(match![2]).toBe('whoami');
	});

	it('returns null for invalid patterns', () => {
		expect(createSafeRegex('[unclosed')).toBeNull();
		expect(createSafeRegex('*invalid')).toBeNull();
	});

	it('returns RegExp for empty string', () => {
		const regex = createSafeRegex('');
		expect(regex).toBeInstanceOf(RegExp);
		expect(regex!.test('anything')).toBe(true);
	});
});

// =============================================================================
// Section Parsers
// =============================================================================

describe('parseMetaSection', () => {
	it('extracts PATH, TITLE, DESC from META section', () => {
		const result = parseMetaSection({
			META: {
				PATH: 'vault://Scripts/helper.ts',
				TITLE: 'Helper Functions',
				DESC: 'Utility functions for the project',
			},
		});
		expect(result.PATH).toBe('vault://Scripts/helper.ts');
		expect(result.TITLE).toBe('Helper Functions');
		expect(result.DESC).toBe('Utility functions for the project');
	});

	it('returns undefined for missing properties', () => {
		const result = parseMetaSection({ META: { PATH: 'vault://file.ts' } });
		expect(result.PATH).toBe('vault://file.ts');
		expect(result.TITLE).toBeUndefined();
		expect(result.DESC).toBeUndefined();
	});

	it('returns all undefined when META is missing', () => {
		const result = parseMetaSection({});
		expect(result.PATH).toBeUndefined();
		expect(result.TITLE).toBeUndefined();
		expect(result.DESC).toBeUndefined();
	});

	it('returns all undefined when META is empty', () => {
		const result = parseMetaSection({ META: {} });
		expect(result.PATH).toBeUndefined();
		expect(result.TITLE).toBeUndefined();
		expect(result.DESC).toBeUndefined();
	});

	it('converts non-string values to strings', () => {
		const result = parseMetaSection({
			META: { PATH: 123, TITLE: true, DESC: 42 },
		});
		expect(result.PATH).toBe('123');
		expect(result.TITLE).toBe('true');
		expect(result.DESC).toBe('42');
	});

	it('handles META as non-object (ignored)', () => {
		expect(parseMetaSection({ META: 'not an object' }).PATH).toBeUndefined();
		expect(parseMetaSection({ META: [1, 2] }).PATH).toBeUndefined();
		expect(parseMetaSection({ META: 42 }).PATH).toBeUndefined();
	});
});

describe('parseRenderDisplaySection', () => {
	it('extracts all RENDER properties', () => {
		const result = parseRenderDisplaySection({
			RENDER: {
				FOLD: 10,
				SCROLL: 20,
				ZEBRA: true,
				LINES: true,
				COPY: false,
				STYLE: 'Tab',
				LANG: 'typescript',
				SHIFT_COPY_JOIN: '&&',
				ALT_COPY_JOIN: ';',
				JOIN_IGNORE_REGEX: '^\\s*#',
				PRINT: 'expand',
			},
		});
		expect(result.FOLD).toBe(10);
		expect(result.SCROLL).toBe(20);
		expect(result.ZEBRA).toBe(true);
		expect(result.LINES).toBe(true);
		expect(result.COPY).toBe(false);
		expect(result.STYLE).toBe('tab'); // lowercased
		expect(result.LANG).toBe('typescript');
		expect(result.SHIFT_COPY_JOIN).toBe('&&');
		expect(result.ALT_COPY_JOIN).toBe(';');
		expect(result.JOIN_IGNORE_REGEX).toBe('^\\s*#');
		expect(result.PRINT).toBe('expand');
	});

	it('returns undefined for missing RENDER section', () => {
		const result = parseRenderDisplaySection({});
		expect(result.FOLD).toBeUndefined();
		expect(result.SCROLL).toBeUndefined();
		expect(result.ZEBRA).toBeUndefined();
		expect(result.LINES).toBeUndefined();
		expect(result.COPY).toBeUndefined();
		expect(result.STYLE).toBeUndefined();
		expect(result.LANG).toBeUndefined();
		expect(result.PRINT).toBeUndefined();
	});

	it('resolves booleans from strings', () => {
		const result = parseRenderDisplaySection({
			RENDER: { ZEBRA: 'true', LINES: 'false', COPY: true },
		});
		expect(result.ZEBRA).toBe(true);
		expect(result.LINES).toBe(false);
		expect(result.COPY).toBe(true);
	});

	it('resolves numbers from strings', () => {
		const result = parseRenderDisplaySection({
			RENDER: { FOLD: '15', SCROLL: '25' },
		});
		expect(result.FOLD).toBe(15);
		expect(result.SCROLL).toBe(25);
	});

	it('lowercases STYLE property', () => {
		expect(parseRenderDisplaySection({ RENDER: { STYLE: 'INFOBAR' } }).STYLE).toBe('infobar');
		expect(parseRenderDisplaySection({ RENDER: { STYLE: 'Minimal' } }).STYLE).toBe('minimal');
	});

	it('prefers ALT_COPY_JOIN over CMD_COPY_JOIN', () => {
		const result = parseRenderDisplaySection({
			RENDER: { ALT_COPY_JOIN: 'alt-op', CMD_COPY_JOIN: 'cmd-op' },
		});
		expect(result.ALT_COPY_JOIN).toBe('alt-op');
	});

	it('uses CMD_COPY_JOIN as fallback when ALT_COPY_JOIN absent', () => {
		const result = parseRenderDisplaySection({
			RENDER: { CMD_COPY_JOIN: 'cmd-op' },
		});
		expect(result.ALT_COPY_JOIN).toBe('cmd-op');
	});

	it('lowercases PRINT property', () => {
		expect(parseRenderDisplaySection({ RENDER: { PRINT: 'Expand' } }).PRINT).toBe('expand');
		expect(parseRenderDisplaySection({ RENDER: { PRINT: 'ASIS' } }).PRINT).toBe('asis');
		expect(parseRenderDisplaySection({ RENDER: { PRINT: 'AsIs' } }).PRINT).toBe('asis');
	});

	it('returns PRINT as undefined when not specified', () => {
		expect(parseRenderDisplaySection({ RENDER: {} }).PRINT).toBeUndefined();
	});

	it('converts non-string PRINT values to string', () => {
		expect(parseRenderDisplaySection({ RENDER: { PRINT: true } }).PRINT).toBe('true');
		expect(parseRenderDisplaySection({ RENDER: { PRINT: 42 } }).PRINT).toBe('42');
	});

	it('handles RENDER as non-object (ignored)', () => {
		const result = parseRenderDisplaySection({ RENDER: 'string' });
		expect(result.FOLD).toBeUndefined();
	});
});

describe('parseLineRange', () => {
	it('parses valid array format', () => {
		expect(parseLineRange([1, 10])).toEqual([1, 10]);
		expect(parseLineRange([5, 5])).toEqual([5, 5]); // start == end
		expect(parseLineRange([100, 200])).toEqual([100, 200]);
	});

	it('parses valid string format', () => {
		expect(parseLineRange('1, 10')).toEqual([1, 10]);
		expect(parseLineRange('5,5')).toEqual([5, 5]); // no space
		expect(parseLineRange('  1  ,  10  ')).toEqual([1, 10]); // whitespace
	});

	it('parses string array elements', () => {
		expect(parseLineRange(['10', '20'])).toEqual([10, 20]);
	});

	it('returns null for start <= 0', () => {
		expect(parseLineRange([0, 10])).toBeNull();
		expect(parseLineRange([-1, 10])).toBeNull();
		expect(parseLineRange('0, 10')).toBeNull();
	});

	it('returns null for end < start', () => {
		expect(parseLineRange([10, 5])).toBeNull();
		expect(parseLineRange('10, 5')).toBeNull();
	});

	it('returns null for wrong array length', () => {
		expect(parseLineRange([10])).toBeNull();
		expect(parseLineRange([1, 2, 3])).toBeNull();
		expect(parseLineRange([])).toBeNull();
	});

	it('returns null for non-numeric strings', () => {
		expect(parseLineRange('abc, def')).toBeNull();
		expect(parseLineRange('10, abc')).toBeNull();
	});

	it('returns null for wrong number of comma-separated parts', () => {
		expect(parseLineRange('10')).toBeNull();
		expect(parseLineRange('1, 2, 3')).toBeNull();
	});

	it('returns null for non-string non-array inputs', () => {
		expect(parseLineRange(undefined)).toBeNull();
		expect(parseLineRange(null)).toBeNull();
		expect(parseLineRange(42)).toBeNull();
		expect(parseLineRange({})).toBeNull();
	});
});

describe('parseFilterSection', () => {
	it('extracts BY_LINES with RANGE and INCLUSIVE', () => {
		const result = parseFilterSection({
			FILTER: {
				BY_LINES: { RANGE: [5, 15], INCLUSIVE: true },
			},
		});
		expect(result.BY_LINES?.RANGE).toEqual([5, 15]);
		expect(result.BY_LINES?.INCLUSIVE).toBe(true);
	});

	it('extracts BY_MARKS with START, END, INCLUSIVE', () => {
		const result = parseFilterSection({
			FILTER: {
				BY_MARKS: { START: '// BEGIN', END: '// END', INCLUSIVE: false },
			},
		});
		expect(result.BY_MARKS?.START).toBe('// BEGIN');
		expect(result.BY_MARKS?.END).toBe('// END');
		expect(result.BY_MARKS?.INCLUSIVE).toBe(false);
	});

	it('handles both BY_LINES and BY_MARKS together', () => {
		const result = parseFilterSection({
			FILTER: {
				BY_LINES: { RANGE: '5, 15' },
				BY_MARKS: { START: 'start', END: 'end' },
			},
		});
		expect(result.BY_LINES?.RANGE).toBe('5, 15');
		expect(result.BY_MARKS?.START).toBe('start');
		expect(result.BY_MARKS?.END).toBe('end');
	});

	it('returns empty object when FILTER is missing', () => {
		const result = parseFilterSection({});
		expect(result.BY_LINES).toBeUndefined();
		expect(result.BY_MARKS).toBeUndefined();
	});

	it('resolves INCLUSIVE from string values', () => {
		const result = parseFilterSection({
			FILTER: {
				BY_LINES: { INCLUSIVE: 'true' },
				BY_MARKS: { INCLUSIVE: 'false' },
			},
		});
		expect(result.BY_LINES?.INCLUSIVE).toBe(true);
		expect(result.BY_MARKS?.INCLUSIVE).toBe(false);
	});

	it('ignores non-object BY_LINES and BY_MARKS', () => {
		const result = parseFilterSection({
			FILTER: {
				BY_LINES: 'not an object',
				BY_MARKS: ['array'],
			},
		});
		expect(result.BY_LINES).toBeUndefined();
		expect(result.BY_MARKS).toBeUndefined();
	});

	it('handles partial BY_MARKS (only START)', () => {
		const result = parseFilterSection({
			FILTER: {
				BY_MARKS: { START: '// BEGIN' },
			},
		});
		expect(result.BY_MARKS?.START).toBe('// BEGIN');
		expect(result.BY_MARKS?.END).toBeUndefined();
	});
});

describe('parseRenderCmdoutSection', () => {
	it('extracts PROMPT, COMMAND, OUTPUT styling', () => {
		const result = parseRenderCmdoutSection({
			RENDER: {
				PROMPT: { COLOUR: '#6b7280', BOLD: true, ITALIC: false },
				COMMAND: { COLOUR: '#98c379', BOLD: false, ITALIC: true },
				OUTPUT: { COLOUR: '#ffffff', BOLD: false, ITALIC: false },
			},
		});
		expect(result.PROMPT?.COLOUR).toBe('#6b7280');
		expect(result.PROMPT?.BOLD).toBe(true);
		expect(result.PROMPT?.ITALIC).toBe(false);
		expect(result.COMMAND?.COLOUR).toBe('#98c379');
		expect(result.COMMAND?.ITALIC).toBe(true);
		expect(result.OUTPUT?.COLOUR).toBe('#ffffff');
	});

	it('returns undefined for missing subsections', () => {
		const result = parseRenderCmdoutSection({});
		expect(result.PROMPT).toBeUndefined();
		expect(result.COMMAND).toBeUndefined();
		expect(result.OUTPUT).toBeUndefined();
	});

	it('handles partial style subsections', () => {
		const result = parseRenderCmdoutSection({
			RENDER: {
				PROMPT: { COLOUR: '#red' },
			},
		});
		expect(result.PROMPT?.COLOUR).toBe('#red');
		expect(result.PROMPT?.BOLD).toBeUndefined();
		expect(result.PROMPT?.ITALIC).toBeUndefined();
	});

	it('resolves string booleans in style subsections', () => {
		const result = parseRenderCmdoutSection({
			RENDER: {
				COMMAND: { BOLD: 'true', ITALIC: 'false' },
			},
		});
		expect(result.COMMAND?.BOLD).toBe(true);
		expect(result.COMMAND?.ITALIC).toBe(false);
	});

	it('handles only some subsections defined', () => {
		const result = parseRenderCmdoutSection({
			RENDER: {
				OUTPUT: { COLOUR: '#green', ITALIC: true },
			},
		});
		expect(result.PROMPT).toBeUndefined();
		expect(result.COMMAND).toBeUndefined();
		expect(result.OUTPUT?.COLOUR).toBe('#green');
		expect(result.OUTPUT?.ITALIC).toBe(true);
	});
});

// =============================================================================
// Block Parsing
// =============================================================================

describe('parseBlockContent', () => {
	it('parses embedded code with YAML + ~~~ separator', () => {
		const content = 'META:\n  TITLE: "Example"\n~~~\nconsole.log("Hello");';
		const result = parseBlockContent(content);
		expect(result.hasEmbeddedCode).toBe(true);
		expect(result.embeddedCode).toBe('console.log("Hello");');
		expect(result.yamlProperties.META).toBeDefined();
	});

	it('parses YAML-only block (file reference)', () => {
		const yaml = 'META:\n  PATH: vault://Scripts/test.ts\n  TITLE: "Test Script"';
		const result = parseBlockContent(yaml);
		expect(result.hasEmbeddedCode).toBe(false);
		expect(result.embeddedCode).toBeNull();
		expect(result.yamlProperties.META).toBeDefined();
	});

	it('treats plain code (no YAML) as embedded code', () => {
		const code = 'function hello() {\n  return "world";\n}';
		const result = parseBlockContent(code);
		expect(result.hasEmbeddedCode).toBe(true);
		expect(result.embeddedCode).toBe(code);
		expect(Object.keys(result.yamlProperties).length).toBe(0);
	});

	it('strips leading newline from embedded code after ~~~', () => {
		const content = 'META:\n  TITLE: "Test"\n~~~\ncode here';
		const result = parseBlockContent(content);
		expect(result.embeddedCode).toBe('code here');
	});

	it('treats YAML without known sections as plain code', () => {
		const yaml = 'UNKNOWN: value\nOTHER: something';
		const result = parseBlockContent(yaml);
		expect(result.hasEmbeddedCode).toBe(true);
		expect(result.embeddedCode).toBe(yaml);
	});

	it('recognises META as a known section', () => {
		const yaml = 'META:\n  PATH: vault://file.ts';
		const result = parseBlockContent(yaml);
		expect(result.hasEmbeddedCode).toBe(false);
	});

	it('recognises RENDER as a known section', () => {
		const yaml = 'RENDER:\n  FOLD: 10';
		const result = parseBlockContent(yaml);
		expect(result.hasEmbeddedCode).toBe(false);
	});

	it('recognises FILTER as a known section', () => {
		const yaml = 'FILTER:\n  BY_LINES:\n    RANGE: "1, 10"';
		const result = parseBlockContent(yaml);
		expect(result.hasEmbeddedCode).toBe(false);
	});

	it('recognises top-level PROMPT as a known section', () => {
		const yaml = 'PROMPT: "^\\\\$ "';
		const result = parseBlockContent(yaml);
		expect(result.hasEmbeddedCode).toBe(false);
	});

	it('handles multi-section YAML with embedded code', () => {
		const content = 'META:\n  TITLE: "Test"\nRENDER:\n  FOLD: 20\n  ZEBRA: true\n~~~\nconst x = 42;';
		const result = parseBlockContent(content);
		expect(result.hasEmbeddedCode).toBe(true);
		expect(result.embeddedCode).toBe('const x = 42;');
		expect(result.yamlProperties.META).toBeDefined();
		expect(result.yamlProperties.RENDER).toBeDefined();
	});

	it('handles empty code after ~~~ separator', () => {
		const content = 'META:\n  TITLE: "Empty"\n~~~\n';
		const result = parseBlockContent(content);
		expect(result.hasEmbeddedCode).toBe(true);
		expect(result.embeddedCode).toBe('');
	});

	it('handles multi-line embedded code', () => {
		const content = 'META:\n  TITLE: "Multi"\n~~~\nline 1\nline 2\nline 3';
		const result = parseBlockContent(content);
		expect(result.embeddedCode).toBe('line 1\nline 2\nline 3');
	});
});

// =============================================================================
// Nested YAML Config
// =============================================================================

describe('parseNestedYamlConfig', () => {
	it('parses complete configuration with all sections', () => {
		const yamlProps = {
			META: { PATH: 'vault://script.ts', TITLE: 'Script', DESC: 'A script' },
			RENDER: { FOLD: 10, ZEBRA: true, LANG: 'typescript' },
			FILTER: { BY_LINES: { RANGE: [1, 20], INCLUSIVE: true } },
			PROMPT: '^\\$ ',
		};
		const result = parseNestedYamlConfig(yamlProps);
		expect(result.META?.PATH).toBe('vault://script.ts');
		expect(result.RENDER?.FOLD).toBe(10);
		expect(result.RENDER?.LANG).toBe('typescript');
		expect(result.FILTER?.BY_LINES?.RANGE).toEqual([1, 20]);
		expect(result.PROMPT).toBe('^\\$ ');
	});

	it('handles empty YAML properties', () => {
		const result = parseNestedYamlConfig({});
		expect(result.META).toBeDefined();
		expect(result.RENDER).toBeDefined();
		expect(result.FILTER).toBeDefined();
		expect(result.PROMPT).toBeUndefined();
		expect(result.RENDER_CMDOUT).toBeDefined();
	});

	it('parses RENDER_CMDOUT subsection', () => {
		const yamlProps = {
			RENDER: {
				PROMPT: { COLOUR: '#red', BOLD: true },
				COMMAND: { COLOUR: '#green' },
			},
		};
		const result = parseNestedYamlConfig(yamlProps);
		expect(result.RENDER_CMDOUT?.PROMPT?.COLOUR).toBe('#red');
		expect(result.RENDER_CMDOUT?.PROMPT?.BOLD).toBe(true);
		expect(result.RENDER_CMDOUT?.COMMAND?.COLOUR).toBe('#green');
	});

	it('converts non-string PROMPT to string', () => {
		const result = parseNestedYamlConfig({ PROMPT: 42 });
		expect(result.PROMPT).toBe('42');
	});

	it('sets PROMPT to undefined when absent', () => {
		const result = parseNestedYamlConfig({ META: { TITLE: 'Test' } });
		expect(result.PROMPT).toBeUndefined();
	});
});

// =============================================================================
// Config Resolution
// =============================================================================

describe('resolveBlockConfig', () => {
	it('uses YAML values when present', () => {
		const parsed: ParsedYamlConfig = {
			META: { PATH: 'vault://file.py', TITLE: 'My File', DESC: 'Description' },
			RENDER: {
				FOLD: 15,
				SCROLL: 20,
				ZEBRA: true,
				LINES: true,
				COPY: false,
				STYLE: 'infobar',
				LANG: 'python',
			},
		};
		const settings = testSettings({
			languageCopyJoinDefaults: {
				text: { shiftJoin: '', altJoin: '', joinIgnoreRegex: '' },
			},
		});
		const result = resolveBlockConfig(parsed, settings, 'text');
		expect(result.sourcePath).toBe('vault://file.py');
		expect(result.titleTemplate).toBe('My File');
		expect(result.descriptionText).toBe('Description');
		expect(result.foldLines).toBe(15);
		expect(result.scrollLines).toBe(20);
		expect(result.showZebraStripes).toBe(true);
		expect(result.showLineNumbers).toBe(true);
		expect(result.showCopyButton).toBe(false);
		expect(result.titleBarStyle).toBe('infobar');
		expect(result.language).toBe('python');
	});

	it('uses settings defaults when YAML not present', () => {
		const settings = testSettings({
			defaultTitleBarStyle: 'minimal',
			showLineNumbers: true,
			foldLines: 10,
			scrollLines: 5,
			languageCopyJoinDefaults: {
				javascript: { shiftJoin: '', altJoin: '', joinIgnoreRegex: '' },
			},
		});
		const result = resolveBlockConfig({}, settings, 'javascript');
		expect(result.titleBarStyle).toBe('minimal');
		expect(result.showLineNumbers).toBe(true);
		expect(result.foldLines).toBe(10);
		expect(result.scrollLines).toBe(5);
		expect(result.language).toBe('javascript');
	});

	it('uses defaultLanguage when LANG not in YAML', () => {
		const settings = testSettings({
			languageCopyJoinDefaults: {
				rust: { shiftJoin: '', altJoin: '', joinIgnoreRegex: '' },
			},
		});
		const result = resolveBlockConfig({ RENDER: {} }, settings, 'rust');
		expect(result.language).toBe('rust');
	});

	it('defaults META to empty/null when missing', () => {
		const settings = testSettings({
			languageCopyJoinDefaults: {
				text: { shiftJoin: '', altJoin: '', joinIgnoreRegex: '' },
			},
		});
		const result = resolveBlockConfig({}, settings, 'text');
		expect(result.sourcePath).toBeNull();
		expect(result.titleTemplate).toBe('');
		expect(result.descriptionText).toBe('');
	});

	it('resolves BY_LINES filter', () => {
		const parsed: ParsedYamlConfig = {
			FILTER: {
				BY_LINES: { RANGE: [10, 20], INCLUSIVE: false },
			},
		};
		const settings = testSettings({
			languageCopyJoinDefaults: {
				text: { shiftJoin: '', altJoin: '', joinIgnoreRegex: '' },
			},
		});
		const result = resolveBlockConfig(parsed, settings, 'text');
		expect(result.filterByLines.enabled).toBe(true);
		expect(result.filterByLines.start).toBe(10);
		expect(result.filterByLines.end).toBe(20);
		expect(result.filterByLines.inclusive).toBe(false);
	});

	it('disables BY_LINES when RANGE is invalid', () => {
		const parsed: ParsedYamlConfig = {
			FILTER: {
				BY_LINES: { RANGE: 'invalid' },
			},
		};
		const settings = testSettings({
			languageCopyJoinDefaults: {
				text: { shiftJoin: '', altJoin: '', joinIgnoreRegex: '' },
			},
		});
		const result = resolveBlockConfig(parsed, settings, 'text');
		expect(result.filterByLines.enabled).toBe(false);
		expect(result.filterByLines.start).toBe(0);
		expect(result.filterByLines.end).toBe(0);
	});

	it('resolves BY_MARKS filter when both START and END present', () => {
		const parsed: ParsedYamlConfig = {
			FILTER: {
				BY_MARKS: { START: '// BEGIN', END: '// END', INCLUSIVE: true },
			},
		};
		const settings = testSettings({
			languageCopyJoinDefaults: {
				text: { shiftJoin: '', altJoin: '', joinIgnoreRegex: '' },
			},
		});
		const result = resolveBlockConfig(parsed, settings, 'text');
		expect(result.filterByMarks.enabled).toBe(true);
		expect(result.filterByMarks.startMarker).toBe('// BEGIN');
		expect(result.filterByMarks.endMarker).toBe('// END');
		expect(result.filterByMarks.inclusive).toBe(true);
	});

	it('disables BY_MARKS when START or END missing', () => {
		const settings = testSettings({
			languageCopyJoinDefaults: {
				text: { shiftJoin: '', altJoin: '', joinIgnoreRegex: '' },
			},
		});
		const onlyStart: ParsedYamlConfig = {
			FILTER: { BY_MARKS: { START: '// BEGIN' } },
		};
		expect(resolveBlockConfig(onlyStart, settings, 'text').filterByMarks.enabled).toBe(false);

		const onlyEnd: ParsedYamlConfig = {
			FILTER: { BY_MARKS: { END: '// END' } },
		};
		expect(resolveBlockConfig(onlyEnd, settings, 'text').filterByMarks.enabled).toBe(false);
	});

	it('defaults INCLUSIVE to true when not specified', () => {
		const parsed: ParsedYamlConfig = {
			FILTER: {
				BY_LINES: { RANGE: [1, 10] },
				BY_MARKS: { START: 'A', END: 'B' },
			},
		};
		const settings = testSettings({
			languageCopyJoinDefaults: {
				text: { shiftJoin: '', altJoin: '', joinIgnoreRegex: '' },
			},
		});
		const result = resolveBlockConfig(parsed, settings, 'text');
		expect(result.filterByLines.inclusive).toBe(true);
		expect(result.filterByMarks.inclusive).toBe(true);
	});

	it('uses per-language copy join defaults', () => {
		const settings = testSettings({
			languageCopyJoinDefaults: {
				python: { shiftJoin: ' && ', altJoin: ' ; ', joinIgnoreRegex: '^\\s*#' },
			},
		});
		const result = resolveBlockConfig({}, settings, 'python');
		expect(result.shiftCopyJoin).toBe(' && ');
		expect(result.altCopyJoin).toBe(' ; ');
		expect(result.joinIgnoreRegex).toBe('^\\s*#');
	});

	it('prefers YAML join values over language defaults', () => {
		const parsed: ParsedYamlConfig = {
			RENDER: { SHIFT_COPY_JOIN: ' | ', ALT_COPY_JOIN: ' + ' },
		};
		const settings = testSettings({
			languageCopyJoinDefaults: {
				python: { shiftJoin: ' && ', altJoin: ' ; ', joinIgnoreRegex: '' },
			},
		});
		const result = resolveBlockConfig(parsed, settings, 'python');
		expect(result.shiftCopyJoin).toBe(' | ');
		expect(result.altCopyJoin).toBe(' + ');
	});

	it('falls back to empty string when no join defaults configured', () => {
		const settings = testSettings({
			languageCopyJoinDefaults: {
				unknown: { shiftJoin: '', altJoin: '', joinIgnoreRegex: '' },
			},
		});
		const result = resolveBlockConfig({}, settings, 'unknown');
		expect(result.shiftCopyJoin).toBe('');
		expect(result.altCopyJoin).toBe('');
		expect(result.joinIgnoreRegex).toBe('');
	});

	it('defaults filter to disabled when no FILTER section', () => {
		const settings = testSettings({
			languageCopyJoinDefaults: {
				text: { shiftJoin: '', altJoin: '', joinIgnoreRegex: '' },
			},
		});
		const result = resolveBlockConfig({}, settings, 'text');
		expect(result.filterByLines.enabled).toBe(false);
		expect(result.filterByLines.start).toBe(0);
		expect(result.filterByLines.end).toBe(0);
		expect(result.filterByMarks.enabled).toBe(false);
		expect(result.filterByMarks.startMarker).toBe('');
		expect(result.filterByMarks.endMarker).toBe('');
	});

	it('uses YAML PRINT value when present', () => {
		const parsed: ParsedYamlConfig = {
			RENDER: { PRINT: 'asis' },
		};
		const settings = testSettings({
			languageCopyJoinDefaults: {
				text: { shiftJoin: '', altJoin: '', joinIgnoreRegex: '' },
			},
		});
		const result = resolveBlockConfig(parsed, settings, 'text');
		expect(result.printBehaviour).toBe('asis');
	});

	it('uses YAML PRINT "expand" when explicitly set', () => {
		const parsed: ParsedYamlConfig = {
			RENDER: { PRINT: 'expand' },
		};
		const settings = testSettings({
			printBehaviour: 'asis',
			languageCopyJoinDefaults: {
				text: { shiftJoin: '', altJoin: '', joinIgnoreRegex: '' },
			},
		});
		const result = resolveBlockConfig(parsed, settings, 'text');
		expect(result.printBehaviour).toBe('expand');
	});

	it('falls back to settings printBehaviour when PRINT not in YAML', () => {
		const settings = testSettings({
			printBehaviour: 'asis',
			languageCopyJoinDefaults: {
				text: { shiftJoin: '', altJoin: '', joinIgnoreRegex: '' },
			},
		});
		const result = resolveBlockConfig({}, settings, 'text');
		expect(result.printBehaviour).toBe('asis');
	});

	it('defaults printBehaviour to "expand" with default settings', () => {
		const settings = testSettings({
			languageCopyJoinDefaults: {
				text: { shiftJoin: '', altJoin: '', joinIgnoreRegex: '' },
			},
		});
		const result = resolveBlockConfig({}, settings, 'text');
		expect(result.printBehaviour).toBe('expand');
	});
});

describe('resolveCmdoutConfig', () => {
	it('builds prompt pattern from PROMPT property', () => {
		const parsed: ParsedYamlConfig = { PROMPT: '^\\$ ' };
		const result = resolveCmdoutConfig(parsed, testSettings());
		expect(result.promptPattern).toBeInstanceOf(RegExp);
		expect(result.promptPattern!.test('$ ')).toBe(true);
		expect(result.promptPattern!.test('normal text')).toBe(false);
	});

	it('sets promptPattern to undefined when PROMPT is absent', () => {
		const result = resolveCmdoutConfig({}, testSettings());
		expect(result.promptPattern).toBeUndefined();
	});

	it('sets promptPattern to undefined for invalid regex', () => {
		const parsed: ParsedYamlConfig = { PROMPT: '[invalid' };
		const result = resolveCmdoutConfig(parsed, testSettings());
		expect(result.promptPattern).toBeUndefined();
	});

	it('extracts META title and description', () => {
		const parsed: ParsedYamlConfig = {
			META: { TITLE: 'Terminal', DESC: 'Example output' },
		};
		const result = resolveCmdoutConfig(parsed, testSettings());
		expect(result.titleText).toBe('Terminal');
		expect(result.descriptionText).toBe('Example output');
	});

	it('uses settings defaults for styling when no overrides', () => {
		const settings = testSettings({
			commandPromptColour: '#ff0000',
			commandPromptBold: true,
			commandTextColour: '#00ff00',
			outputTextColour: '#0000ff',
		});
		const result = resolveCmdoutConfig({}, settings);
		expect(result.styles.promptColour).toBe('#ff0000');
		expect(result.styles.promptBold).toBe(true);
		expect(result.styles.commandColour).toBe('#00ff00');
		expect(result.styles.outputColour).toBe('#0000ff');
	});

	it('overrides settings defaults with YAML styling', () => {
		const parsed: ParsedYamlConfig = {
			RENDER_CMDOUT: {
				PROMPT: { COLOUR: '#custom', BOLD: false },
				COMMAND: { ITALIC: true },
			},
		};
		const settings = testSettings({
			commandPromptColour: '#default',
			commandPromptBold: true,
		});
		const result = resolveCmdoutConfig(parsed, settings);
		expect(result.styles.promptColour).toBe('#custom');
		expect(result.styles.promptBold).toBe(false);
		expect(result.styles.commandItalic).toBe(true);
	});

	it('uses SCROLL and COPY from RENDER section', () => {
		const parsed: ParsedYamlConfig = {
			RENDER: { SCROLL: 30, COPY: false },
		};
		const result = resolveCmdoutConfig(parsed, testSettings());
		expect(result.scrollLines).toBe(30);
		expect(result.showCopyButton).toBe(false);
	});

	it('uses settings defaults for SCROLL and COPY', () => {
		const settings = testSettings({ scrollLines: 15, showCopyButton: false });
		const result = resolveCmdoutConfig({}, settings);
		expect(result.scrollLines).toBe(15);
		expect(result.showCopyButton).toBe(false);
	});

	it('defaults descriptionText to empty string', () => {
		const result = resolveCmdoutConfig({}, testSettings());
		expect(result.descriptionText).toBe('');
	});

	it('defaults titleText to undefined when not set', () => {
		const result = resolveCmdoutConfig({}, testSettings());
		expect(result.titleText).toBeUndefined();
	});

	it('uses YAML PRINT value for printBehaviour', () => {
		const parsed: ParsedYamlConfig = {
			RENDER: { PRINT: 'asis' },
		};
		const result = resolveCmdoutConfig(parsed, testSettings());
		expect(result.printBehaviour).toBe('asis');
	});

	it('falls back to settings printBehaviour when PRINT not in YAML', () => {
		const result = resolveCmdoutConfig({}, testSettings({ printBehaviour: 'asis' }));
		expect(result.printBehaviour).toBe('asis');
	});

	it('defaults printBehaviour to "expand" with default settings', () => {
		const result = resolveCmdoutConfig({}, testSettings());
		expect(result.printBehaviour).toBe('expand');
	});
});
