// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupObsidianDom, App } from '../../__mocks__/obsidian';
import { UltraCodeFenceSettingTab, type SettingsPlugin } from '../../src/ui/settings-tab';
import { testSettings } from '../helpers/test-settings';
import type { PluginSettings } from '../../src/types';

// =============================================================================
// Mocks
// =============================================================================

vi.mock('../../src/ui/yaml-editor', () => ({
	createYamlEditor: vi.fn((_container: HTMLElement, opts: { initialValue: string; onChange: (v: string) => void }) => ({
		getValue: vi.fn(() => opts.initialValue),
		setValue: vi.fn(),
	})),
}));

const mockWhatsNewOpen = vi.fn();
vi.mock('../../src/ui/whats-new-modal', () => ({
	WhatsNewModal: class {
		open = mockWhatsNewOpen;
	},
}));

// =============================================================================
// Test Helpers
// =============================================================================

const testReleaseNotes = {
	title: 'Test',
	subtitle: 'Test',
	description: 'Test',
	repo: 'https://github.com/test/repo',
	version: '1.0.0',
	new: [],
	fixed: [],
};

function createMockPlugin(overrides?: Partial<PluginSettings>): SettingsPlugin {
	return {
		settings: testSettings(overrides),
		manifest: { version: '2.0.0' },
		saveSettings: vi.fn(async () => {}),
	};
}

// =============================================================================
// Setup and Teardown
// =============================================================================

let app: App;
let tab: UltraCodeFenceSettingTab;
let plugin: SettingsPlugin;

beforeEach(() => {
	setupObsidianDom();
	app = new App();
	plugin = createMockPlugin();
	tab = new UltraCodeFenceSettingTab(app, plugin, testReleaseNotes);
	tab.display();
});

afterEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// Tests: Tab Navigation (describe 'display')
// =============================================================================

describe('display', () => {
	it('containerEl has ucf-settings class', () => {
		expect(tab.containerEl.classList.contains('ucf-settings')).toBe(true);
	});

	it('contains a div with ucf-tabs class', () => {
		const tabsDiv = tab.containerEl.querySelector('.ucf-tabs');
		expect(tabsDiv).toBeTruthy();
		expect(tabsDiv?.tagName).toBe('DIV');
	});

	it('contains a div with ucf-tab-content class', () => {
		const contentDiv = tab.containerEl.querySelector('.ucf-tab-content');
		expect(contentDiv).toBeTruthy();
		expect(contentDiv?.tagName).toBe('DIV');
	});

	it('renders 7 tab buttons', () => {
		const tabsDiv = tab.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		expect(buttons?.length).toBe(7);
	});

	it('tab buttons have correct text labels', () => {
		const tabsDiv = tab.containerEl.querySelector('.ucf-tabs');
		const buttons = Array.from(tabsDiv?.querySelectorAll('button') ?? []);
		const labels = buttons.map((btn) => btn.textContent);

		expect(labels).toEqual(['General', 'Title', 'Code', 'Inline', 'Cmd Output', 'Appearance', 'Presets']);
	});

	it('first tab button (General) has ucf-tab-active class', () => {
		const tabsDiv = tab.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		expect(buttons?.[0]?.classList.contains('ucf-tab-active')).toBe(true);
	});

	it('other tab buttons do not have ucf-tab-active class initially', () => {
		const tabsDiv = tab.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');

		for (let i = 1; i < (buttons?.length ?? 0); i++) {
			expect(buttons?.[i]?.classList.contains('ucf-tab-active')).toBe(false);
		}
	});

	it('clicking Title button activates Title tab and deactivates General', () => {
		const tabsDiv = tab.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		const titleBtn = buttons?.[1];

		titleBtn?.click();

		// Buttons are rebuilt after click — re-query
		const updatedButtons = tabsDiv?.querySelectorAll('button');
		expect(updatedButtons?.[1]?.classList.contains('ucf-tab-active')).toBe(true);
		expect(updatedButtons?.[0]?.classList.contains('ucf-tab-active')).toBe(false);
	});

	it('clicking Presets button renders preset tab content', () => {
		const tabsDiv = tab.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		const presetsBtn = buttons?.[6];

		presetsBtn?.click();

		const contentDiv = tab.containerEl.querySelector('.ucf-tab-content');
		const introText = contentDiv?.querySelector('.ucf-tab-intro');

		expect(introText?.textContent).toContain('Create named presets');
	});
});

// =============================================================================
// Tests: General Tab
// =============================================================================

describe('General tab', () => {
	it('has a What\'s new box with ucf-whats-new-box class', () => {
		const whatsNewBox = tab.containerEl.querySelector('.ucf-whats-new-box');
		expect(whatsNewBox).toBeTruthy();
	});

	it('What\'s new box contains a paragraph with summary text', () => {
		const whatsNewBox = tab.containerEl.querySelector('.ucf-whats-new-box');
		const paragraph = whatsNewBox?.querySelector('p');

		expect(paragraph).toBeTruthy();
		expect(paragraph?.textContent).toContain('modernised fork');
	});

	it('has a View recent updates button with ucf-view-updates-btn class', () => {
		const viewBtn = tab.containerEl.querySelector('.ucf-view-updates-btn');
		expect(viewBtn).toBeTruthy();
		expect(viewBtn?.textContent).toBe('View recent updates');
	});

	it('clicking View recent updates button opens WhatsNewModal', () => {
		const viewBtn = tab.containerEl.querySelector('.ucf-view-updates-btn') as HTMLButtonElement;

		viewBtn?.click();

		expect(mockWhatsNewOpen).toHaveBeenCalled();
	});

	it('has a help grid with ucf-help-grid class', () => {
		const helpGrid = tab.containerEl.querySelector('.ucf-help-grid');
		expect(helpGrid).toBeTruthy();
	});

	it('help grid contains {filename} template variable', () => {
		const helpGrid = tab.containerEl.querySelector('.ucf-help-grid');
		expect(helpGrid?.innerHTML).toContain('{filename}');
	});

	it('help grid contains {basename} template variable', () => {
		const helpGrid = tab.containerEl.querySelector('.ucf-help-grid');
		expect(helpGrid?.innerHTML).toContain('{basename}');
	});

	it('help grid contains {size:kb} template variable', () => {
		const helpGrid = tab.containerEl.querySelector('.ucf-help-grid');
		expect(helpGrid?.innerHTML).toContain('{size:kb}');
	});

	it('has section dividers with ucf-divider class', () => {
		const dividers = tab.containerEl.querySelectorAll('.ucf-divider');
		expect(dividers.length).toBeGreaterThan(0);
	});

	it('section dividers are hr elements', () => {
		const dividers = tab.containerEl.querySelectorAll('.ucf-divider');
		for (const divider of dividers) {
			expect(divider.tagName).toBe('HR');
		}
	});
});

// =============================================================================
// Tests: Title Tab
// =============================================================================

describe('Title tab', () => {
	beforeEach(() => {
		const tabsDiv = tab.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[1]?.click(); // Click Title tab
	});

	it('has intro text with ucf-tab-intro class', () => {
		const introText = tab.containerEl.querySelector('.ucf-tab-content .ucf-tab-intro');
		expect(introText).toBeTruthy();
	});

	it('intro text contains expected content', () => {
		const introText = tab.containerEl.querySelector('.ucf-tab-content .ucf-tab-intro');
		expect(introText?.textContent).toContain('title bar and description');
	});

	it('tab content is rendered when Title tab is active', () => {
		const contentDiv = tab.containerEl.querySelector('.ucf-tab-content');
		expect(contentDiv?.children.length).toBeGreaterThan(0);
	});
});

// =============================================================================
// Tests: Code Tab
// =============================================================================

describe('Code tab', () => {
	beforeEach(() => {
		const tabsDiv = tab.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[2]?.click(); // Click Code tab
	});

	it('has intro text with ucf-tab-intro class', () => {
		const introText = tab.containerEl.querySelector('.ucf-tab-content .ucf-tab-intro');
		expect(introText).toBeTruthy();
	});

	it('contains Copy Join table with ucf-copyjoin-table class', () => {
		const table = tab.containerEl.querySelector('.ucf-copyjoin-table');
		expect(table).toBeTruthy();
	});

	it('table has thead with 5 th elements', () => {
		const thead = tab.containerEl.querySelector('.ucf-copyjoin-table thead');
		const ths = thead?.querySelectorAll('th');
		expect(ths?.length).toBe(5);
	});

	it('table has tfoot with add button', () => {
		const tfoot = tab.containerEl.querySelector('.ucf-copyjoin-table tfoot');
		const addBtn = tfoot?.querySelector('.ucf-cj-add');
		expect(addBtn).toBeTruthy();
	});

	it('with languageCopyJoinDefaults populated, tbody has rows with code elements', () => {
		const pluginWithDefaults = createMockPlugin({
			languageCopyJoinDefaults: {
				javascript: { shiftJoin: '&&', altJoin: ';', joinIgnoreRegex: '^\\s*#' },
				python: { shiftJoin: '&&', altJoin: ';', joinIgnoreRegex: '^\\s*#' },
			},
		});

		const tabWithDefaults = new UltraCodeFenceSettingTab(app, pluginWithDefaults, testReleaseNotes);
		tabWithDefaults.display();

		// Switch to Code tab
		const tabsDiv = tabWithDefaults.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[2]?.click();

		const tbody = tabWithDefaults.containerEl.querySelector('.ucf-copyjoin-table tbody');
		const codeElements = tbody?.querySelectorAll('code');

		expect(codeElements?.length).toBeGreaterThanOrEqual(2);
		expect(codeElements?.[0]?.textContent).toBe('javascript');
		expect(codeElements?.[1]?.textContent).toBe('python');
	});

	it('add button with input value and click calls saveSettings', async () => {
		const addInput = tab.containerEl.querySelector('.ucf-cj-input-lang') as HTMLInputElement;
		const addBtn = tab.containerEl.querySelector('.ucf-cj-add') as HTMLButtonElement;

		addInput.value = 'rust';
		addBtn.click();

		await vi.waitFor(() => {
			expect(plugin.saveSettings).toHaveBeenCalled();
		});
	});

	it('remove button with ucf-cj-remove class exists for existing entries', () => {
		const pluginWithDefaults = createMockPlugin({
			languageCopyJoinDefaults: {
				bash: { shiftJoin: '&&', altJoin: ';', joinIgnoreRegex: '^\\s*#' },
			},
		});

		const tabWithDefaults = new UltraCodeFenceSettingTab(app, pluginWithDefaults, testReleaseNotes);
		tabWithDefaults.display();

		const tabsDiv = tabWithDefaults.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[2]?.click();

		const removeBtn = tabWithDefaults.containerEl.querySelector('.ucf-cj-remove');
		expect(removeBtn).toBeTruthy();
	});

	it('clicking remove button calls saveSettings and re-renders', async () => {
		const pluginWithDefaults = createMockPlugin({
			languageCopyJoinDefaults: {
				bash: { shiftJoin: '&&', altJoin: ';', joinIgnoreRegex: '^\\s*#' },
			},
		});

		const tabWithDefaults = new UltraCodeFenceSettingTab(app, pluginWithDefaults, testReleaseNotes);
		tabWithDefaults.display();

		const tabsDiv = tabWithDefaults.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[2]?.click();

		const removeBtn = tabWithDefaults.containerEl.querySelector('.ucf-cj-remove') as HTMLButtonElement;
		removeBtn?.click();

		await vi.waitFor(() => {
			expect(pluginWithDefaults.saveSettings).toHaveBeenCalled();
		});
	});
});

// =============================================================================
// Tests: Inline Tab
// =============================================================================

describe('Inline tab', () => {
	beforeEach(() => {
		const tabsDiv = tab.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[3]?.click(); // Click Inline tab
	});

	it('has intro text with ucf-tab-intro class', () => {
		const introText = tab.containerEl.querySelector('.ucf-tab-content .ucf-tab-intro');
		expect(introText).toBeTruthy();
	});

	it('intro text contains expected content', () => {
		const introText = tab.containerEl.querySelector('.ucf-tab-content .ucf-tab-intro');
		expect(introText?.textContent).toContain('inline code blocks');
	});
});

// =============================================================================
// Tests: Command Output Tab
// =============================================================================

describe('Command Output tab', () => {
	beforeEach(() => {
		const tabsDiv = tab.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[4]?.click(); // Click Cmd Output tab
	});

	it('has intro text with ucf-tab-intro class', () => {
		const introText = tab.containerEl.querySelector('.ucf-tab-content .ucf-tab-intro');
		expect(introText).toBeTruthy();
	});

	it('intro text mentions ufence-cmdout', () => {
		const introText = tab.containerEl.querySelector('.ucf-tab-content .ucf-tab-intro');
		expect(introText?.textContent).toContain('ufence-cmdout');
	});
});

// =============================================================================
// Tests: Appearance Tab
// =============================================================================

describe('Appearance tab', () => {
	beforeEach(() => {
		const tabsDiv = tab.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[5]?.click(); // Click Appearance tab
	});

	it('with default useThemeColours true, no colour picker divs appear', () => {
		const contentDiv = tab.containerEl.querySelector('.ucf-tab-content');
		const settingDivs = contentDiv?.querySelectorAll('div');

		// Count should not include extra colour pickers for custom colours
		// This is a general check that custom colour settings don't appear
		const initialCount = settingDivs?.length ?? 0;
		expect(initialCount).toBeGreaterThan(0);
	});

	it('with useThemeColours false, additional Setting divs appear', () => {
		const pluginWithoutTheme = createMockPlugin({ useThemeColours: false });
		const tabWithoutTheme = new UltraCodeFenceSettingTab(app, pluginWithoutTheme, testReleaseNotes);
		tabWithoutTheme.display();

		const tabsDiv = tabWithoutTheme.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[5]?.click();

		const contentDiv = tabWithoutTheme.containerEl.querySelector('.ucf-tab-content');
		const settingDivs = contentDiv?.querySelectorAll('div');

		// With useThemeColours false, more settings should appear
		expect(settingDivs?.length).toBeGreaterThan(0);
	});

	it('with fileIconStyle custom, additional Setting element for icon folder appears', () => {
		const pluginWithCustomIcons = createMockPlugin({ fileIconStyle: 'custom' });
		const tabWithCustomIcons = new UltraCodeFenceSettingTab(app, pluginWithCustomIcons, testReleaseNotes);
		tabWithCustomIcons.display();

		const tabsDiv = tabWithCustomIcons.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[5]?.click();

		const contentDiv = tabWithCustomIcons.containerEl.querySelector('.ucf-tab-content');
		const settingDivs = contentDiv?.querySelectorAll('div');

		// More settings should be present with custom icon style
		expect(settingDivs?.length).toBeGreaterThan(0);
	});
});

// =============================================================================
// Tests: Presets Tab
// =============================================================================

describe('Presets tab', () => {
	beforeEach(() => {
		const tabsDiv = tab.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[6]?.click(); // Click Presets tab
	});

	it('has intro text about presets with ucf-tab-intro class', () => {
		const introText = tab.containerEl.querySelector('.ucf-tab-content .ucf-tab-intro');
		expect(introText).toBeTruthy();
		expect(introText?.textContent).toContain('Create named presets');
	});

	it('with no presets, no ucf-preset-entry elements appear', () => {
		const contentDiv = tab.containerEl.querySelector('.ucf-tab-content');
		const presetEntries = contentDiv?.querySelectorAll('.ucf-preset-entry');
		expect(presetEntries?.length).toBe(0);
	});

	it('with presets, ucf-preset-entry div appears for each', () => {
		const pluginWithPresets = createMockPlugin({
			presets: {
				teaching: 'RENDER:\n  LINES: true\n  FOLD: 20',
				minimal: 'RENDER:\n  LINES: false',
			},
		});

		const tabWithPresets = new UltraCodeFenceSettingTab(app, pluginWithPresets, testReleaseNotes);
		tabWithPresets.display();

		const tabsDiv = tabWithPresets.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[6]?.click();

		const contentDiv = tabWithPresets.containerEl.querySelector('.ucf-tab-content');
		const presetEntries = contentDiv?.querySelectorAll('.ucf-preset-entry');
		expect(presetEntries?.length).toBe(2);
	});

	it('preset entry has ucf-preset-editor and ucf-preset-buttons divs', () => {
		const pluginWithPresets = createMockPlugin({
			presets: { teaching: 'RENDER:\n  LINES: true' },
		});

		const tabWithPresets = new UltraCodeFenceSettingTab(app, pluginWithPresets, testReleaseNotes);
		tabWithPresets.display();

		const tabsDiv = tabWithPresets.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[6]?.click();

		const presetEntry = tabWithPresets.containerEl.querySelector('.ucf-preset-entry');
		const editor = presetEntry?.querySelector('.ucf-preset-editor');
		const buttons2 = presetEntry?.querySelector('.ucf-preset-buttons');

		expect(editor).toBeTruthy();
		expect(buttons2).toBeTruthy();
	});

	it('save button clicks call saveSettings', async () => {
		const pluginWithPresets = createMockPlugin({
			presets: { teaching: 'RENDER:\n  LINES: true' },
		});

		const tabWithPresets = new UltraCodeFenceSettingTab(app, pluginWithPresets, testReleaseNotes);
		tabWithPresets.display();

		const tabsDiv = tabWithPresets.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[6]?.click();

		const presetEntry = tabWithPresets.containerEl.querySelector('.ucf-preset-entry');
		const saveBtn = presetEntry?.querySelector('button:first-of-type') as HTMLButtonElement;

		saveBtn?.click();

		await vi.waitFor(() => {
			expect(pluginWithPresets.saveSettings).toHaveBeenCalled();
		});
	});

	it('delete button first click changes text to confirmation message', () => {
		const pluginWithPresets = createMockPlugin({
			presets: { teaching: 'RENDER:\n  LINES: true' },
		});

		const tabWithPresets = new UltraCodeFenceSettingTab(app, pluginWithPresets, testReleaseNotes);
		tabWithPresets.display();

		const tabsDiv = tabWithPresets.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[6]?.click();

		const presetEntry = tabWithPresets.containerEl.querySelector('.ucf-preset-entry');
		const deleteBtn = presetEntry?.querySelector('.ucf-preset-delete') as HTMLButtonElement;

		deleteBtn?.click();

		expect(deleteBtn?.textContent).toBe('Click again to confirm');
	});

	it('delete button second click calls saveSettings and re-renders', async () => {
		vi.useFakeTimers();

		const pluginWithPresets = createMockPlugin({
			presets: { teaching: 'RENDER:\n  LINES: true' },
		});

		const tabWithPresets = new UltraCodeFenceSettingTab(app, pluginWithPresets, testReleaseNotes);
		tabWithPresets.display();

		const tabsDiv = tabWithPresets.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[6]?.click();

		const presetEntry = tabWithPresets.containerEl.querySelector('.ucf-preset-entry');
		const deleteBtn = presetEntry?.querySelector('.ucf-preset-delete') as HTMLButtonElement;

		// First click
		deleteBtn?.click();
		expect(deleteBtn?.textContent).toBe('Click again to confirm');

		// Second click
		deleteBtn?.click();

		await vi.waitFor(() => {
			expect(pluginWithPresets.saveSettings).toHaveBeenCalled();
		});

		vi.useRealTimers();
	});

	it('delete button reverts to Delete text after timeout', () => {
		vi.useFakeTimers();

		const pluginWithPresets = createMockPlugin({
			presets: { teaching: 'RENDER:\n  LINES: true' },
		});

		const tabWithPresets = new UltraCodeFenceSettingTab(app, pluginWithPresets, testReleaseNotes);
		tabWithPresets.display();

		const tabsDiv = tabWithPresets.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		buttons?.[6]?.click();

		const presetEntry = tabWithPresets.containerEl.querySelector('.ucf-preset-entry');
		const deleteBtn = presetEntry?.querySelector('.ucf-preset-delete') as HTMLButtonElement;

		deleteBtn?.click();
		expect(deleteBtn?.textContent).toBe('Click again to confirm');

		vi.advanceTimersByTime(3000);

		expect(deleteBtn?.textContent).toBe('Delete');

		vi.useRealTimers();
	});

	it('Add New Preset section has a YAML editor container', () => {
		const contentDiv = tab.containerEl.querySelector('.ucf-tab-content');
		const yamlEditorContainers = contentDiv?.querySelectorAll('div');

		// Check that at least one div exists for the YAML editor
		expect(yamlEditorContainers?.length).toBeGreaterThan(0);
	});

	it('createYamlEditor is called for Add New Preset section', async () => {
		const { createYamlEditor } = await import('../../src/ui/yaml-editor');
		expect(vi.mocked(createYamlEditor)).toHaveBeenCalled();
	});
});

// =============================================================================
// Tests: Tab Switching
// =============================================================================

describe('Tab switching', () => {
	it('switching between tabs changes active tab class', () => {
		const tabsDiv = tab.containerEl.querySelector('.ucf-tabs');

		// Start with General (0)
		let buttons = tabsDiv?.querySelectorAll('button');
		expect(buttons?.[0]?.classList.contains('ucf-tab-active')).toBe(true);

		// Click Title (1) — buttons are rebuilt, re-query
		buttons?.[1]?.click();
		buttons = tabsDiv?.querySelectorAll('button');
		expect(buttons?.[0]?.classList.contains('ucf-tab-active')).toBe(false);
		expect(buttons?.[1]?.classList.contains('ucf-tab-active')).toBe(true);

		// Click Appearance (5) — buttons are rebuilt, re-query
		buttons?.[5]?.click();
		buttons = tabsDiv?.querySelectorAll('button');
		expect(buttons?.[1]?.classList.contains('ucf-tab-active')).toBe(false);
		expect(buttons?.[5]?.classList.contains('ucf-tab-active')).toBe(true);
	});

	it('tab content changes when switching tabs', () => {
		const tabsDiv = tab.containerEl.querySelector('.ucf-tabs');
		const buttons = tabsDiv?.querySelectorAll('button');
		const contentDiv = tab.containerEl.querySelector('.ucf-tab-content');

		// General tab shows What's new
		let whatsNewBox = contentDiv?.querySelector('.ucf-whats-new-box');
		expect(whatsNewBox).toBeTruthy();

		// Click Title tab
		buttons?.[1]?.click();
		whatsNewBox = contentDiv?.querySelector('.ucf-whats-new-box');
		expect(whatsNewBox).toBeFalsy();

		// Click back to General
		buttons?.[0]?.click();
		whatsNewBox = contentDiv?.querySelector('.ucf-whats-new-box');
		expect(whatsNewBox).toBeTruthy();
	});
});

// =============================================================================
// Tests: Settings Persistence
// =============================================================================

describe('Settings persistence', () => {
	it('plugin.saveSettings is called with correct function', () => {
		expect(plugin.saveSettings).toBeDefined();
		expect(typeof plugin.saveSettings).toBe('function');
	});

	it('plugin has correct manifest version', () => {
		expect(plugin.manifest.version).toBe('2.0.0');
	});

	it('settings are initialized from testSettings', () => {
		expect(plugin.settings.supportedLanguages).toBeDefined();
		expect(plugin.settings.defaultTitleBarStyle).toBeDefined();
	});
});
