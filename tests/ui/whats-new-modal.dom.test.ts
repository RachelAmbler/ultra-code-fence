// @vitest-environment jsdom

/**
 * Tests for src/ui/whats-new-modal.ts
 *
 * Covers:
 * - WhatsNewModal class construction and DOM rendering
 * - onOpen() content population
 * - onClose() cleanup
 * - showWhatsNewIfUpdated() version comparison and scheduling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupObsidianDom, App } from '../../__mocks__/obsidian';
import { WhatsNewModal, showWhatsNewIfUpdated } from '../../src/ui/whats-new-modal';
import type { ReleaseNotesData, ChangelogItem } from '../../src/types';

describe('WhatsNewModal', () => {
	let app: App;
	let container: HTMLElement;

	beforeEach(() => {
		setupObsidianDom();
		app = new App();
		container = document.createElement('div');
		document.body.appendChild(container);
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
		if (container.parentElement) {
			container.parentElement.removeChild(container);
		}
	});

	// ============================================================================
	// Modal Construction Tests
	// ============================================================================

	it('creates modal with app, version, and release notes', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test Release',
			subtitle: 'February 2026',
			description: 'Test description',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const modal = new WhatsNewModal(app, '1.0.0', releaseNotes);

		expect(modal.app).toBe(app);
		expect(modal.contentEl).toBeTruthy();
	});

	// ============================================================================
	// onOpen() - Content Structure Tests
	// ============================================================================

	it('adds whatsNewModal class to contentEl', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test Release',
			subtitle: 'February 2026',
			description: 'Test description',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const modal = new WhatsNewModal(app, '1.0.0', releaseNotes);
		modal.onOpen();

		expect(modal.contentEl.classList.contains('ucf-whats-new-modal')).toBe(true);
	});

	it('renders title from release notes', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Amazing New Features',
			subtitle: 'February 2026',
			description: 'Test description',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const modal = new WhatsNewModal(app, '1.0.0', releaseNotes);
		modal.onOpen();

		const title = modal.contentEl.querySelector('h2');
		expect(title?.textContent).toBe('Amazing New Features');
	});

	it('renders version info with version and subtitle', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test Release',
			subtitle: 'February 2026',
			description: 'Test description',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const modal = new WhatsNewModal(app, '2.5.3', releaseNotes);
		modal.onOpen();

		const versionInfo = modal.contentEl.querySelector('.ucf-version-info');
		expect(versionInfo).toBeTruthy();

		const strong = versionInfo?.querySelector('strong');
		expect(strong?.textContent).toBe('Version 2.5.3');

		const subtitle = versionInfo?.querySelector('span');
		expect(subtitle?.textContent).toBe(' • February 2026');
	});

	it('renders description text with ucf-intro-text class', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test Release',
			subtitle: 'February 2026',
			description: 'This is a great update with lots of improvements.',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const modal = new WhatsNewModal(app, '1.0.0', releaseNotes);
		modal.onOpen();

		const intro = modal.contentEl.querySelector('.ucf-intro-text');
		expect(intro?.textContent).toBe('This is a great update with lots of improvements.');
	});

	// ============================================================================
	// New Features Section Tests
	// ============================================================================

	it('renders "New" section when items present', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test Release',
			subtitle: 'February 2026',
			description: 'Test description',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [
				{ highlight: 'Dark Mode', text: 'New dark theme support' },
				{ highlight: 'Performance', text: 'Faster rendering engine' },
			],
			fixed: [],
		};

		const modal = new WhatsNewModal(app, '1.0.0', releaseNotes);
		modal.onOpen();

		const sections = modal.contentEl.querySelectorAll('.ucf-changelog-section');
		expect(sections.length).toBeGreaterThan(0);

		const newSection = Array.from(sections).find((s) => s.querySelector('h3')?.textContent === 'New');
		expect(newSection).toBeTruthy();

		const newHeader = newSection?.querySelector('.ucf-changelog-new');
		expect(newHeader?.textContent).toBe('New');
	});

	it('does not render "New" section when empty', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test Release',
			subtitle: 'February 2026',
			description: 'Test description',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [{ highlight: 'Bug', text: 'Fixed something' }],
		};

		const modal = new WhatsNewModal(app, '1.0.0', releaseNotes);
		modal.onOpen();

		const newHeaders = modal.contentEl.querySelectorAll('.ucf-changelog-new');
		expect(newHeaders.length).toBe(0);
	});

	// ============================================================================
	// Fixed Section Tests
	// ============================================================================

	it('renders "Fixed" section when items present', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test Release',
			subtitle: 'February 2026',
			description: 'Test description',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [
				{ highlight: 'Crash', text: 'Fixed crash on startup' },
				{ highlight: 'Memory', text: 'Reduced memory usage' },
			],
		};

		const modal = new WhatsNewModal(app, '1.0.0', releaseNotes);
		modal.onOpen();

		const sections = modal.contentEl.querySelectorAll('.ucf-changelog-section');
		const fixedSection = Array.from(sections).find((s) => s.querySelector('h3')?.textContent === 'Fixed');
		expect(fixedSection).toBeTruthy();

		const fixedHeader = fixedSection?.querySelector('.ucf-changelog-fixed');
		expect(fixedHeader?.textContent).toBe('Fixed');
	});

	it('does not render "Fixed" section when empty', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test Release',
			subtitle: 'February 2026',
			description: 'Test description',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [{ highlight: 'Feature', text: 'New feature added' }],
			fixed: [],
		};

		const modal = new WhatsNewModal(app, '1.0.0', releaseNotes);
		modal.onOpen();

		const fixedHeaders = modal.contentEl.querySelectorAll('.ucf-changelog-fixed');
		expect(fixedHeaders.length).toBe(0);
	});

	// ============================================================================
	// Changelog Item Tests
	// ============================================================================

	it('renders changelog items with highlight and text', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test Release',
			subtitle: 'February 2026',
			description: 'Test description',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [{ highlight: 'Feature Name', text: 'Description of feature' }],
			fixed: [],
		};

		const modal = new WhatsNewModal(app, '1.0.0', releaseNotes);
		modal.onOpen();

		const listItems = modal.contentEl.querySelectorAll('li');
		expect(listItems.length).toBeGreaterThan(0);

		const firstItem = listItems[0];
		const highlight = firstItem.querySelector('.ucf-highlight');
		expect(highlight?.textContent).toBe('Feature Name');

		// The text " - Description of feature" is in a span created by createSpan()
		expect(firstItem.textContent).toContain('Description of feature');
	});

	it('does not render issue links when issues array is empty', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test Release',
			subtitle: 'February 2026',
			description: 'Test description',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [{ highlight: 'Feature', text: 'No issue links', issues: [] }],
			fixed: [],
		};

		const modal = new WhatsNewModal(app, '1.0.0', releaseNotes);
		modal.onOpen();

		const issueLinks = modal.contentEl.querySelectorAll('.ucf-issue-link');
		expect(issueLinks.length).toBe(0);
	});

	it('renders issue links with correct href', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test Release',
			subtitle: 'February 2026',
			description: 'Test description',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [
				{
					highlight: 'Feature',
					text: 'With issue links',
					issues: [123, 456],
				},
			],
			fixed: [],
		};

		const modal = new WhatsNewModal(app, '1.0.0', releaseNotes);
		modal.onOpen();

		const issueLinks = modal.contentEl.querySelectorAll('.ucf-issue-link');
		expect(issueLinks.length).toBe(2);

		const firstLink = issueLinks[0] as HTMLAnchorElement;
		expect(firstLink.textContent).toBe('#123');
		expect(firstLink.href).toBe('https://github.com/example/repo/issues/123');
		expect(firstLink.getAttribute('target')).toBe('_blank');

		const secondLink = issueLinks[1] as HTMLAnchorElement;
		expect(secondLink.textContent).toBe('#456');
		expect(secondLink.href).toBe('https://github.com/example/repo/issues/456');
	});

	// ============================================================================
	// Credits Tests
	// ============================================================================

	it('renders credits section with copyright', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test Release',
			subtitle: 'February 2026',
			description: 'Test description',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const modal = new WhatsNewModal(app, '1.0.0', releaseNotes);
		modal.onOpen();

		const credits = modal.contentEl.querySelector('.ucf-credits');
		expect(credits).toBeTruthy();
		expect(credits?.textContent).toContain('© 2026');
		expect(credits?.textContent).toContain('Rachel Ambler');
	});

	// ============================================================================
	// Close Button Tests
	// ============================================================================

	it('renders "Got it!" close button with mod-cta class', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test Release',
			subtitle: 'February 2026',
			description: 'Test description',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const modal = new WhatsNewModal(app, '1.0.0', releaseNotes);
		modal.onOpen();

		const buttonContainer = modal.contentEl.querySelector('.ucf-modal-buttons');
		expect(buttonContainer).toBeTruthy();

		const closeButton = buttonContainer?.querySelector('button');
		expect(closeButton?.textContent).toBe('Got it!');
		expect(closeButton?.classList.contains('mod-cta')).toBe(true);
	});

	it('calls close() when button is clicked', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test Release',
			subtitle: 'February 2026',
			description: 'Test description',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const modal = new WhatsNewModal(app, '1.0.0', releaseNotes);
		const closeSpy = vi.spyOn(modal, 'close');

		modal.onOpen();

		const closeButton = modal.contentEl.querySelector('button');
		closeButton?.click();

		expect(closeSpy).toHaveBeenCalled();
	});

	// ============================================================================
	// onClose() Tests
	// ============================================================================

	it('empties contentEl on close', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test Release',
			subtitle: 'February 2026',
			description: 'Test description',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const modal = new WhatsNewModal(app, '1.0.0', releaseNotes);
		modal.onOpen();

		expect(modal.contentEl.children.length).toBeGreaterThan(0);

		modal.onClose();

		expect(modal.contentEl.children.length).toBe(0);
	});

	// ============================================================================
	// Complex Content Tests
	// ============================================================================

	it('renders both New and Fixed sections with multiple items', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Version 3.2.1',
			subtitle: 'February 2026',
			description: 'A major update with many improvements.',
			repo: 'https://github.com/example/repo',
			version: '3.2.1',
			new: [
				{ highlight: 'Dark Mode', text: 'Full dark theme support', issues: [100] },
				{ highlight: 'Performance', text: '40% faster rendering', issues: [101, 102] },
				{ highlight: 'API', text: 'New REST endpoints', issues: undefined },
			],
			fixed: [
				{ highlight: 'Memory Leak', text: 'Fixed memory leak in renderer', issues: [103] },
				{ highlight: 'UI Bug', text: 'Fixed button alignment', issues: undefined },
			],
		};

		const modal = new WhatsNewModal(app, '3.2.1', releaseNotes);
		modal.onOpen();

		// Check New section exists
		const newItems = modal.contentEl.querySelectorAll('.ucf-changelog-section');
		expect(newItems.length).toBe(2);

		// Check all items are rendered
		const allItems = modal.contentEl.querySelectorAll('li');
		expect(allItems.length).toBe(5); // 3 new + 2 fixed

		// Check issue links
		const issueLinks = modal.contentEl.querySelectorAll('.ucf-issue-link');
		expect(issueLinks.length).toBe(4); // 1 + 2 + 1 from new, 1 from fixed
	});
});

describe('showWhatsNewIfUpdated', () => {
	let app: App;

	beforeEach(() => {
		setupObsidianDom();
		app = new App();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	// ============================================================================
	// Version Comparison Tests
	// ============================================================================

	it('returns false when versions match', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test',
			subtitle: 'Test',
			description: 'Test',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const result = showWhatsNewIfUpdated(app, '1.0.0', '1.0.0', releaseNotes);

		expect(result).toBe(false);
	});

	it('returns true when versions differ', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test',
			subtitle: 'Test',
			description: 'Test',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const result = showWhatsNewIfUpdated(app, '1.0.0', '0.9.0', releaseNotes);

		expect(result).toBe(true);
	});

	// ============================================================================
	// Modal Scheduling Tests
	// ============================================================================

	it('schedules modal opening with default delay', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test',
			subtitle: 'Test',
			description: 'Test',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const createSpy = vi.spyOn(WhatsNewModal.prototype, 'open');

		showWhatsNewIfUpdated(app, '1.0.0', '0.9.0', releaseNotes);

		// Modal should not be opened immediately
		expect(createSpy).not.toHaveBeenCalled();

		// Advance timer by default delay (1000ms)
		vi.advanceTimersByTime(1000);

		// Modal should be opened after delay
		expect(createSpy).toHaveBeenCalled();
	});

	it('schedules modal opening with custom delay', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test',
			subtitle: 'Test',
			description: 'Test',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const createSpy = vi.spyOn(WhatsNewModal.prototype, 'open');

		showWhatsNewIfUpdated(app, '1.0.0', '0.9.0', releaseNotes, 500);

		// Advance by custom delay
		vi.advanceTimersByTime(500);

		expect(createSpy).toHaveBeenCalled();
	});

	it('does not schedule modal opening when versions match', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test',
			subtitle: 'Test',
			description: 'Test',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const createSpy = vi.spyOn(WhatsNewModal.prototype, 'open');

		showWhatsNewIfUpdated(app, '1.0.0', '1.0.0', releaseNotes);

		vi.advanceTimersByTime(2000);

		expect(createSpy).not.toHaveBeenCalled();
	});

	// ============================================================================
	// Multiple Version Changes
	// ============================================================================

	it('detects version upgrade from 0.9.0 to 1.0.0', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test',
			subtitle: 'Test',
			description: 'Test',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const result = showWhatsNewIfUpdated(app, '1.0.0', '0.9.0', releaseNotes);

		expect(result).toBe(true);
	});

	it('detects version upgrade from 1.0.0 to 2.0.0', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test',
			subtitle: 'Test',
			description: 'Test',
			repo: 'https://github.com/example/repo',
			version: '2.0.0',
			new: [],
			fixed: [],
		};

		const result = showWhatsNewIfUpdated(app, '2.0.0', '1.0.0', releaseNotes);

		expect(result).toBe(true);
	});

	it('detects version downgrade from 2.0.0 to 1.0.0', () => {
		const releaseNotes: ReleaseNotesData = {
			title: 'Test',
			subtitle: 'Test',
			description: 'Test',
			repo: 'https://github.com/example/repo',
			version: '1.0.0',
			new: [],
			fixed: [],
		};

		const result = showWhatsNewIfUpdated(app, '1.0.0', '2.0.0', releaseNotes);

		expect(result).toBe(true);
	});
});
