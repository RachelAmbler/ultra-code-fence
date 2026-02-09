/**
 * Obsidian mock for unit testing.
 *
 * Provides a working parseYaml implementation using js-yaml,
 * which is what Obsidian uses internally, plus stubs for DOM-facing
 * Obsidian APIs used by renderers and UI components.
 */

import yaml from 'js-yaml';

// =============================================================================
// YAML
// =============================================================================

export function parseYaml(content: string): unknown {
	return yaml.load(content);
}

// =============================================================================
// Platform
// =============================================================================

export const Platform = {
	isMacOS: false,
	isIosApp: false,
	isDesktopApp: true,
};

// =============================================================================
// Component
// =============================================================================

export class Component {
	load(): void { /* no-op */ }
	unload(): void { /* no-op */ }
}

// =============================================================================
// TFile
// =============================================================================

export class TFile {
	path: string;
	stat: { mtime: number; size: number };

	constructor(path = '', stat?: { mtime: number; size: number }) {
		this.path = path;
		this.stat = stat ?? { mtime: Date.now(), size: 0 };
	}
}

// =============================================================================
// App
// =============================================================================

export class App {
	vault = {
		getAbstractFileByPath: (_path: string): TFile | null => null,
		adapter: {
			getResourcePath: (path: string): string => `app://local/${path}`,
		},
	};
	workspace = {
		getLeaf: (_newLeaf?: boolean) => ({
			openFile: async (_file: TFile): Promise<void> => { /* no-op */ },
		}),
	};
}

// =============================================================================
// MarkdownRenderer
// =============================================================================

export const MarkdownRenderer = {
	render: async (
		_app: App,
		markdown: string,
		container: HTMLElement,
		_sourcePath: string,
		_component: Component
	): Promise<void> => {
		container.innerHTML = markdown;
	},
};

// =============================================================================
// MarkdownView
// =============================================================================

export class MarkdownView {
	file: TFile | null = null;
}

// =============================================================================
// Modal
// =============================================================================

export class Modal {
	app: App;
	contentEl: HTMLElement;

	constructor(app: App) {
		this.app = app;
		// Create a real div if we're in a DOM environment, otherwise a stub
		this.contentEl = typeof document !== 'undefined'
			? document.createElement('div')
			: ({} as HTMLElement);
	}

	open(): void { /* no-op */ }
	close(): void { /* no-op */ }
}

// =============================================================================
// PluginSettingTab
// =============================================================================

export class PluginSettingTab {
	app: App;
	containerEl: HTMLElement;

	constructor(app: App) {
		this.app = app;
		this.containerEl = typeof document !== 'undefined'
			? document.createElement('div')
			: ({} as HTMLElement);
	}

	display(): void { /* no-op */ }
}

// =============================================================================
// Setting (chainable builder)
// =============================================================================

/**
 * Creates a fully-chainable stub object where every method call returns
 * the same object. This lets the Obsidian Setting API chaining
 * (e.g. `.setPlaceholder(...).setValue(...).onChange(...)`) work in tests.
 */
function _chainStub(): Record<string, unknown> {
	const self: Record<string, unknown> = {};
	const proxy: Record<string, unknown> = new Proxy(self, {
		get(_target, prop) {
			if (prop in self) return self[prop];
			// Any unknown property returns a function that returns the proxy
			return (..._args: unknown[]) => proxy;
		},
	});
	return proxy;
}

export class Setting {
	settingEl: HTMLElement;
	nameEl: HTMLElement;
	descEl: HTMLElement;

	constructor(_containerEl: HTMLElement) {
		if (typeof document !== 'undefined') {
			this.settingEl = document.createElement('div');
			this.nameEl = document.createElement('div');
			this.descEl = document.createElement('div');
			_containerEl.appendChild(this.settingEl);
		} else {
			this.settingEl = {} as HTMLElement;
			this.nameEl = {} as HTMLElement;
			this.descEl = {} as HTMLElement;
		}
	}

	setName(_name: string): this { return this; }
	setDesc(_desc: string): this { return this; }
	setHeading(): this { return this; }
	setClass(_cls: string): this { return this; }

	addToggle(cb: (toggle: Record<string, unknown>) => void): this {
		const stub = _chainStub();
		cb(stub);
		return this;
	}

	addText(cb: (text: Record<string, unknown>) => void): this {
		const stub = _chainStub();
		cb(stub);
		return this;
	}

	addDropdown(cb: (dropdown: Record<string, unknown>) => void): this {
		const stub = _chainStub();
		cb(stub);
		return this;
	}

	addButton(cb: (btn: Record<string, unknown>) => void): this {
		const stub = _chainStub();
		cb(stub);
		return this;
	}

	addTextArea(cb: (ta: Record<string, unknown>) => void): this {
		const stub = _chainStub();
		stub.inputEl = typeof document !== 'undefined'
			? document.createElement('textarea')
			: ({} as HTMLTextAreaElement);
		cb(stub);
		return this;
	}

	addColorPicker(cb: (picker: Record<string, unknown>) => void): this {
		const stub = _chainStub();
		cb(stub);
		return this;
	}
}

// =============================================================================
// Plugin
// =============================================================================

export class Plugin {
	app: App;
	manifest: { id: string; name: string; version: string };

	constructor(app?: App) {
		this.app = app ?? new App();
		this.manifest = { id: 'test-plugin', name: 'Test Plugin', version: '0.0.1' };
	}

	async loadData(): Promise<unknown> { return null; }
	async saveData(_data: unknown): Promise<void> { /* no-op */ }
}

// =============================================================================
// requestUrl
// =============================================================================

export async function requestUrl(_opts: { url: string }): Promise<{ text: string; status: number }> {
	return { text: '', status: 200 };
}

// =============================================================================
// DOM Helpers — Obsidian extends HTMLElement prototype
// =============================================================================

/**
 * Patches HTMLElement.prototype with Obsidian-style helpers.
 *
 * Call this in beforeEach() for jsdom-based tests so that
 * `el.createEl()`, `el.createSpan()`, `el.empty()`, `el.addClass()`,
 * `el.removeClass()`, and `el.setAttr()` work as expected.
 */
export function setupObsidianDom(): void {
	if (typeof HTMLElement === 'undefined') return;

	const proto = HTMLElement.prototype as HTMLElement & Record<string, unknown>;

	// createEl(tag, options?) — creates and appends a child element
	if (!proto.createEl) {
		(proto as Record<string, unknown>).createEl = function (
			this: HTMLElement,
			tag: string,
			options?: { cls?: string; text?: string; attr?: Record<string, string>; href?: string }
		): HTMLElement {
			const el = document.createElement(tag);
			if (options?.cls) {
				for (const c of options.cls.split(' ')) {
					if (c) el.classList.add(c);
				}
			}
			if (options?.text) el.textContent = options.text;
			if (options?.attr) {
				for (const [k, v] of Object.entries(options.attr)) {
					el.setAttribute(k, v);
				}
			}
			if (options?.href) el.setAttribute('href', options.href);
			this.appendChild(el);
			return el;
		};
	}

	// createSpan(options?) — shorthand for createEl('span', ...)
	if (!proto.createSpan) {
		(proto as Record<string, unknown>).createSpan = function (
			this: HTMLElement,
			options?: { cls?: string; text?: string; attr?: Record<string, string> }
		): HTMLSpanElement {
			return (this as HTMLElement & { createEl: (tag: string, opts?: unknown) => HTMLElement }).createEl('span', options) as HTMLSpanElement;
		};
	}

	// empty() — removes all children
	if (!proto.empty) {
		(proto as Record<string, unknown>).empty = function (this: HTMLElement): void {
			while (this.firstChild) this.removeChild(this.firstChild);
		};
	}

	// addClass(cls) — adds a CSS class
	if (!proto.addClass) {
		(proto as Record<string, unknown>).addClass = function (this: HTMLElement, cls: string): void {
			this.classList.add(cls);
		};
	}

	// removeClass(cls) — removes a CSS class
	if (!proto.removeClass) {
		(proto as Record<string, unknown>).removeClass = function (this: HTMLElement, cls: string): void {
			this.classList.remove(cls);
		};
	}

	// setAttr(name, value) — sets an attribute
	if (!proto.setAttr) {
		(proto as Record<string, unknown>).setAttr = function (this: HTMLElement, name: string, value: string): void {
			this.setAttribute(name, value);
		};
	}
}
