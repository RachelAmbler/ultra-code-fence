/**
 * Tests for src/services/download-service.ts
 *
 * Covers: buildSuggestedFilename
 */

import { describe, it, expect } from 'vitest';
import { buildSuggestedFilename } from '../../src/services/download-service';

describe('buildSuggestedFilename', () => {
	// -------------------------------------------------------------------------
	// When title is provided
	// -------------------------------------------------------------------------

	it('uses title as base with language extension', () => {
		expect(buildSuggestedFilename('myScript', 'py')).toBe('myScript.py');
	});

	it('keeps existing file extension from title', () => {
		expect(buildSuggestedFilename('build.gradle', 'kotlin')).toBe('build.gradle');
	});

	it('sanitises invalid filename characters', () => {
		expect(buildSuggestedFilename('my<file>name', 'ts')).toBe('my_file_name.ts');
	});

	it('sanitises colons and pipes', () => {
		expect(buildSuggestedFilename('C:\\path|file', 'js')).toBe('C__path_file.js');
	});

	it('sanitises question marks and asterisks', () => {
		expect(buildSuggestedFilename('file?*name', 'txt')).toBe('file__name.txt');
	});

	it('sanitises double quotes and slashes', () => {
		expect(buildSuggestedFilename('"file/name"', 'sh')).toBe('_file_name_.sh');
	});

	it('trims whitespace from sanitised title', () => {
		expect(buildSuggestedFilename('  myFile  ', 'go')).toBe('myFile.go');
	});

	it('preserves dots in multi-dot filenames', () => {
		expect(buildSuggestedFilename('app.config.json', 'js')).toBe('app.config.json');
	});

	// -------------------------------------------------------------------------
	// When title is empty
	// -------------------------------------------------------------------------

	it('falls back to code.{lang} when title is empty', () => {
		expect(buildSuggestedFilename('', 'python')).toBe('code.python');
	});

	it('falls back to code.txt when both title and language are empty', () => {
		expect(buildSuggestedFilename('', '')).toBe('code.txt');
	});

	// -------------------------------------------------------------------------
	// Language fallback
	// -------------------------------------------------------------------------

	it('uses txt extension when language is empty', () => {
		expect(buildSuggestedFilename('readme', '')).toBe('readme.txt');
	});

	it('handles title with extension and empty language', () => {
		expect(buildSuggestedFilename('data.csv', '')).toBe('data.csv');
	});
});
