// @vitest-environment jsdom

/**
 * Tests for src/ui/yaml-editor.ts
 *
 * Covers:
 * - createYamlEditor (DOM creation, event handling, validation)
 * - YamlEditorHandle.getValue() and setValue()
 * - YAML validation with parseYaml
 * - Integration with highlightYaml and validateYamlSchema
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupObsidianDom } from '../../__mocks__/obsidian';
import { createYamlEditor } from '../../src/ui/yaml-editor';
import { validateYamlSchema, formatWarnings } from '../../src/ui/yaml-validator';

// Mock yaml highlighter
vi.mock('../../src/ui/yaml-highlighter', () => ({
	highlightYaml: vi.fn((text: string) => {
		// Simple mock: wrap lines in spans
		return text
			.split('\n')
			.map((line) => `<span class="line">${line}</span>`)
			.join('\n');
	}),
}));

// Mock yaml validator
vi.mock('../../src/ui/yaml-validator', () => ({
	validateYamlSchema: vi.fn(() => []),
	formatWarnings: vi.fn((warnings: unknown[]) => `${warnings.length} warning(s)`),
}));

describe('createYamlEditor', () => {
	let container: HTMLElement;

	beforeEach(() => {
		setupObsidianDom();
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	afterEach(() => {
		if (container.parentElement) {
			container.parentElement.removeChild(container);
		}
	});

	// ============================================================================
	// DOM Structure Tests
	// ============================================================================

	it('creates wrapper div with ucf-yaml-editor class', () => {
		const onChange = vi.fn();
		createYamlEditor(container, {
			initialValue: 'key: value',
			onChange,
		});

		const wrapper = container.querySelector('.ucf-yaml-editor');
		expect(wrapper).toBeTruthy();
		expect(wrapper?.tagName).toBe('DIV');
	});

	it('creates pre.ucf-yaml-highlight with code child', () => {
		const onChange = vi.fn();
		createYamlEditor(container, {
			initialValue: 'key: value',
			onChange,
		});

		const pre = container.querySelector('.ucf-yaml-highlight');
		expect(pre).toBeTruthy();
		expect(pre?.tagName).toBe('PRE');

		const code = pre?.querySelector('code');
		expect(code).toBeTruthy();
	});

	it('creates textarea.ucf-yaml-input with correct attributes', () => {
		const onChange = vi.fn();
		createYamlEditor(container, {
			initialValue: 'key: value',
			onChange,
		});

		const textarea = container.querySelector('.ucf-yaml-input');
		expect(textarea).toBeTruthy();
		expect(textarea?.tagName).toBe('TEXTAREA');
		expect((textarea as HTMLTextAreaElement).getAttribute('rows')).toBe('8');
		expect((textarea as HTMLTextAreaElement).getAttribute('spellcheck')).toBe('false');
		expect((textarea as HTMLTextAreaElement).getAttribute('autocomplete')).toBe('off');
		expect((textarea as HTMLTextAreaElement).getAttribute('autocorrect')).toBe('off');
		expect((textarea as HTMLTextAreaElement).getAttribute('autocapitalize')).toBe('off');
	});

	it('creates status div outside wrapper with ucf-yaml-status class', () => {
		const onChange = vi.fn();
		createYamlEditor(container, {
			initialValue: 'key: value',
			onChange,
		});

		const status = container.querySelector('.ucf-yaml-status');
		expect(status).toBeTruthy();
		expect(status?.tagName).toBe('DIV');

		// Status should be a direct child of container, not inside wrapper
		const wrapper = container.querySelector('.ucf-yaml-editor');
		expect(wrapper?.contains(status)).toBe(false);
	});

	// ============================================================================
	// Initialization Tests
	// ============================================================================

	it('sets textarea value to initialValue', () => {
		const initialValue = 'name: John\nage: 30';
		const onChange = vi.fn();
		createYamlEditor(container, {
			initialValue,
			onChange,
		});

		const textarea = container.querySelector('.ucf-yaml-input') as HTMLTextAreaElement;
		expect(textarea.value).toBe(initialValue);
	});

	it('sets placeholder if provided', () => {
		const onChange = vi.fn();
		const placeholder = 'Enter YAML here...';
		createYamlEditor(container, {
			initialValue: '',
			placeholder,
			onChange,
		});

		const textarea = container.querySelector('.ucf-yaml-input') as HTMLTextAreaElement;
		expect(textarea.placeholder).toBe(placeholder);
	});

	it('does not set placeholder if not provided', () => {
		const onChange = vi.fn();
		createYamlEditor(container, {
			initialValue: '',
			onChange,
		});

		const textarea = container.querySelector('.ucf-yaml-input') as HTMLTextAreaElement;
		expect(textarea.placeholder).toBe('');
	});

	// ============================================================================
	// getValue/setValue Tests
	// ============================================================================

	it('getValue returns textarea value', () => {
		const initialValue = 'key: value';
		const onChange = vi.fn();
		const editor = createYamlEditor(container, {
			initialValue,
			onChange,
		});

		expect(editor.getValue()).toBe(initialValue);
	});

	it('setValue updates textarea value', () => {
		const onChange = vi.fn();
		const editor = createYamlEditor(container, {
			initialValue: 'old: value',
			onChange,
		});

		const newValue = 'new: value';
		editor.setValue(newValue);

		const textarea = container.querySelector('.ucf-yaml-input') as HTMLTextAreaElement;
		expect(textarea.value).toBe(newValue);
		expect(editor.getValue()).toBe(newValue);
	});

	// ============================================================================
	// onChange Tests
	// ============================================================================

	it('calls onChange when textarea input event fires', () => {
		const onChange = vi.fn();
		createYamlEditor(container, {
			initialValue: '',
			onChange,
		});

		const textarea = container.querySelector('.ucf-yaml-input') as HTMLTextAreaElement;
		textarea.value = 'key: value';
		textarea.dispatchEvent(new Event('input'));

		expect(onChange).toHaveBeenCalledWith('key: value');
	});

	it('does not call onChange during initial creation', () => {
		const onChange = vi.fn();
		createYamlEditor(container, {
			initialValue: 'key: value',
			onChange,
		});

		expect(onChange).not.toHaveBeenCalled();
	});

	// ============================================================================
	// Validation Tests
	// ============================================================================

	it('shows "Valid YAML" status for valid YAML object', () => {
		const onChange = vi.fn();
		const editor = createYamlEditor(container, {
			initialValue: '',
			onChange,
		});

		editor.setValue('key: value');

		const status = container.querySelector('.ucf-yaml-status') as HTMLDivElement;
		expect(status.textContent).toBe('Valid YAML');
		expect(status.classList.contains('ucf-yaml-status-valid')).toBe(true);
	});

	it('shows "Not a YAML mapping..." status for non-object YAML', () => {
		const onChange = vi.fn();
		const editor = createYamlEditor(container, {
			initialValue: '',
			onChange,
		});

		// A bare scalar string is not an object — parseYaml('hello') returns a string
		editor.setValue('hello');

		const status = container.querySelector('.ucf-yaml-status') as HTMLDivElement;
		expect(status.textContent).toContain('Not a YAML mapping');
		expect(status.classList.contains('ucf-yaml-status-invalid')).toBe(true);
	});

	it('clears status for empty YAML', () => {
		const onChange = vi.fn();
		const editor = createYamlEditor(container, {
			initialValue: 'key: value',
			onChange,
		});

		editor.setValue('');

		const status = container.querySelector('.ucf-yaml-status') as HTMLDivElement;
		expect(status.textContent).toBe('');
		expect(status.className).toBe('ucf-yaml-status');
	});

	it('shows warning status when schema validation finds issues', () => {
		const onChange = vi.fn();

		// Temporarily make validateYamlSchema return warnings
		const mockValidate = vi.mocked(validateYamlSchema);
		const mockFormat = vi.mocked(formatWarnings);
		mockValidate.mockReturnValueOnce([{ key: 'UNKNOWN', message: 'Unrecognised top-level key' }]);
		mockFormat.mockReturnValueOnce('1 warning(s)');

		const editor = createYamlEditor(container, {
			initialValue: '',
			onChange,
		});

		editor.setValue('UNKNOWN: value');

		const status = container.querySelector('.ucf-yaml-status') as HTMLDivElement;
		expect(status.classList.contains('ucf-yaml-status-warning')).toBe(true);
	});

	it('shows error status for invalid YAML syntax', () => {
		const onChange = vi.fn();
		const editor = createYamlEditor(container, {
			initialValue: '',
			onChange,
		});

		// Invalid YAML syntax (unmatched quotes)
		editor.setValue('key: "unclosed');

		const status = container.querySelector('.ucf-yaml-status') as HTMLDivElement;
		expect(status.classList.contains('ucf-yaml-status-invalid')).toBe(true);
		expect(status.textContent).toBeTruthy(); // Should have error message
	});

	// ============================================================================
	// Highlight Integration Tests
	// ============================================================================

	it('updates highlight on setValue', () => {
		const onChange = vi.fn();
		const editor = createYamlEditor(container, {
			initialValue: '',
			onChange,
		});

		editor.setValue('key: value');

		const code = container.querySelector('.ucf-yaml-highlight > code');
		expect(code?.textContent).toBeTruthy();
	});

	it('clears highlight for empty value', () => {
		const onChange = vi.fn();
		const editor = createYamlEditor(container, {
			initialValue: 'key: value',
			onChange,
		});

		editor.setValue('');

		const code = container.querySelector('.ucf-yaml-highlight > code') as HTMLElement;
		// Should contain only trailing newline after clearing
		expect(code.innerHTML).toBe('\n');
	});

	// ============================================================================
	// Edge Cases
	// ============================================================================

	it('handles whitespace-only initial value as empty', () => {
		const onChange = vi.fn();
		const editor = createYamlEditor(container, {
			initialValue: '   \n  \n  ',
			onChange,
		});

		const status = container.querySelector('.ucf-yaml-status') as HTMLDivElement;
		expect(status.textContent).toBe('');
	});

	it('handles multiple setValue calls', () => {
		const onChange = vi.fn();
		const editor = createYamlEditor(container, {
			initialValue: '',
			onChange,
		});

		editor.setValue('first: value');
		expect(editor.getValue()).toBe('first: value');

		editor.setValue('second: value');
		expect(editor.getValue()).toBe('second: value');

		editor.setValue('third: value');
		expect(editor.getValue()).toBe('third: value');
	});

	it('preserves exact formatting in getValue', () => {
		const formattedYaml = 'key1: value1\n  nested:\n    deep: value2';
		const onChange = vi.fn();
		const editor = createYamlEditor(container, {
			initialValue: formattedYaml,
			onChange,
		});

		expect(editor.getValue()).toBe(formattedYaml);
	});
});
