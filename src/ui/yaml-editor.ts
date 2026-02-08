/**
 * Ultra Code Fence - YAML Editor Component
 *
 * Provides a textarea with live syntax highlighting and YAML validation.
 * Uses the "transparent textarea over highlighted pre" technique:
 *
 *   div.ucf-yaml-editor          (positioned wrapper)
 *     pre.ucf-yaml-highlight     (absolutely positioned, fills wrapper)
 *       code                     (inner code element)
 *     textarea.ucf-yaml-input    (in normal flow, controls height, transparent text)
 *     div.ucf-yaml-status        (validation status line)
 *
 * The textarea is in normal flow so it controls the wrapper height.
 * The pre is absolutely positioned to fill the same space.
 * The textarea has transparent text colour so the highlighted <pre>
 * shows through, but the user still types into the real textarea.
 */

import { parseYaml } from 'obsidian';
import { highlightYaml } from './yaml-highlighter';
import { validateYamlSchema, formatWarnings } from './yaml-validator';

// =============================================================================
// Types
// =============================================================================

export interface YamlEditorOptions {
	/** Initial YAML content */
	initialValue: string;
	/** Placeholder text for empty editor */
	placeholder?: string;
	/** Called on every input change */
	onChange: (value: string) => void;
}

export interface YamlEditorHandle {
	/** Get the current textarea value */
	getValue: () => string;
	/** Set the textarea value and re-highlight */
	setValue: (value: string) => void;
}

// =============================================================================
// Editor Factory
// =============================================================================

/**
 * Creates a YAML editor with syntax highlighting and validation.
 *
 * @param container - Parent element to append the editor into
 * @param options - Editor configuration
 * @returns Handle for getting/setting the value programmatically
 */
export function createYamlEditor(
	container: HTMLElement,
	options: YamlEditorOptions
): YamlEditorHandle {
	// -- Wrapper --
	const wrapper = container.createEl('div', { cls: 'ucf-yaml-editor' });

	// -- Highlighted <pre> (absolutely positioned, fills wrapper) --
	const pre = wrapper.createEl('pre', { cls: 'ucf-yaml-highlight' });
	const code = pre.createEl('code');

	// -- Textarea (in normal flow — this controls the wrapper height) --
	const textarea = wrapper.createEl('textarea', {
		cls: 'ucf-yaml-input',
		attr: {
			rows: '8',
			spellcheck: 'false',
			autocomplete: 'off',
			autocorrect: 'off',
			autocapitalize: 'off',
		},
	});

	if (options.placeholder) {
		textarea.placeholder = options.placeholder;
	}

	// -- Status line (outside the editor wrapper so the absolutely-positioned
	//    pre background doesn't cover it) --
	const status = container.createEl('div', { cls: 'ucf-yaml-status' });

	// -- Initial state --
	textarea.value = options.initialValue;
	updateHighlight();
	validateYaml();

	// -- Event listeners --
	textarea.addEventListener('input', () => {
		updateHighlight();
		validateYaml();
		options.onChange(textarea.value);
	});

	// Sync scroll position between textarea and pre
	textarea.addEventListener('scroll', syncScroll);

	// -- Internal functions --

	function updateHighlight(): void {
		const value = textarea.value;
		if (value.trim() === '') {
			code.innerHTML = '';
		} else {
			code.innerHTML = highlightYaml(value);
		}
		// Append a trailing newline so the pre doesn't collapse the last line
		code.innerHTML += '\n';
	}

	function validateYaml(): void {
		const value = textarea.value.trim();

		if (value === '') {
			status.textContent = '';
			status.className = 'ucf-yaml-status';
			return;
		}

		try {
			const parsed = parseYaml(value);
			if (parsed === null || parsed === undefined) {
				setStatus('Empty YAML', 'invalid');
			} else if (typeof parsed !== 'object') {
				setStatus('Not a YAML mapping — expected key: value pairs', 'invalid');
			} else {
				// Syntax is fine — now check for unrecognised keys
				const warnings = validateYamlSchema(parsed);
				if (warnings.length > 0) {
					setStatus(formatWarnings(warnings), 'warning');
				} else {
					setStatus('Valid YAML', 'valid');
				}
			}
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			// Extract just the useful part of the error message
			const short = message.replace(/^YAMLException:\s*/i, '').split('\n')[0];
			setStatus(short, 'invalid');
		}
	}

	function setStatus(text: string, level: 'valid' | 'warning' | 'invalid'): void {
		status.textContent = text;
		status.className = `ucf-yaml-status ucf-yaml-status-${level}`;
	}

	function syncScroll(): void {
		pre.scrollTop = textarea.scrollTop;
		pre.scrollLeft = textarea.scrollLeft;
	}

	// -- Public handle --

	return {
		getValue: () => textarea.value,
		setValue: (value: string) => {
			textarea.value = value;
			updateHighlight();
			validateYaml();
		},
	};
}
