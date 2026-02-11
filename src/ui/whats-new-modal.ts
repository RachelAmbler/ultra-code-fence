/**
 * Ultra Code Fence - What's New Modal
 *
 * Displays release notes when the plugin is updated.
 * Shows new features, bug fixes, and links to GitHub issues.
 */

import { App, Modal } from 'obsidian';
import type { ReleaseNotesData, ChangelogItem } from '../types';
import { CSS_CLASSES } from '../constants';

// =============================================================================
// Modal Implementation
// =============================================================================

/**
 * Modal that displays release notes for the current version.
 *
 * Shown automatically when the plugin updates, or manually from settings.
 * Content is loaded from whatsnew.json.
 */
export class WhatsNewModal extends Modal {
	private pluginVersion: string;
	private releaseNotes: ReleaseNotesData;

	/**
	 * Creates a new What's New modal.
	 *
	 * @param app - Obsidian App instance
	 * @param pluginVersion - Current plugin version
	 * @param releaseNotes - Release notes data
	 */
	constructor(app: App, pluginVersion: string, releaseNotes: ReleaseNotesData) {
		super(app);
		this.pluginVersion = pluginVersion;
		this.releaseNotes = releaseNotes;
	}

	/**
	 * Builds the modal content when opened.
	 */
	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass(CSS_CLASSES.whatsNewModal);

		// Title
		contentEl.createEl('h2', { text: this.releaseNotes.title });

		// Version info
		const versionInfo = contentEl.createEl('div', { cls: CSS_CLASSES.versionInfo });
		versionInfo.createEl('strong', { text: `Version ${this.pluginVersion}` });
		versionInfo.createEl('span', { text: ` • ${this.releaseNotes.subtitle}` });

		// Description
		contentEl.createEl('p', {
			text: this.releaseNotes.description,
			cls: CSS_CLASSES.introText,
		});

		// New features section
		if (this.releaseNotes.new.length > 0) {
			this.renderChangelogSection(contentEl, 'New', CSS_CLASSES.changelogNew, this.releaseNotes.new);
		}

		// Bug fixes section
		if (this.releaseNotes.fixed.length > 0) {
			this.renderChangelogSection(contentEl, 'Fixed', CSS_CLASSES.changelogFixed, this.releaseNotes.fixed);
		}

		// Credits
		const credits = contentEl.createEl('div', { cls: CSS_CLASSES.credits });
		credits.createEl('p', {
			text: '© 2026 - Rachel Ambler (ARACS Thoughtworks). All rights reserved.',
		});

		// Close button
		const buttonContainer = contentEl.createEl('div', { cls: CSS_CLASSES.modalButtons });
		const closeButton = buttonContainer.createEl('button', {
			text: 'Got it!',
			cls: 'mod-cta',
		});
		closeButton.addEventListener('click', () => { this.close(); });
	}

	/**
	 * Renders a changelog section (New or Fixed).
	 *
	 * @param containerElement - Parent container
	 * @param sectionTitle - Section title
	 * @param headerClass - CSS class for the header
	 * @param items - List of changelog items
	 */
	private renderChangelogSection(
		containerElement: HTMLElement,
		sectionTitle: string,
		headerClass: string,
		items: ChangelogItem[]
	): void {
		const section = containerElement.createEl('div', { cls: CSS_CLASSES.changelogSection });
		section.createEl('h3', { text: sectionTitle, cls: headerClass });

		const listElement = section.createEl('ul');

		for (const item of items) {
			this.renderChangelogListItem(listElement, item);
		}
	}

	/**
	 * Renders a single changelog item with optional issue links.
	 *
	 * @param listElement - Parent list element
	 * @param item - Changelog item data
	 */
	private renderChangelogListItem(listElement: HTMLUListElement, item: ChangelogItem): void {
		const listItem = listElement.createEl('li');

		// Highlighted feature name
		listItem.createEl('span', { text: item.highlight, cls: CSS_CLASSES.highlight });
		listItem.createSpan({ text: ` - ${item.text}` });

		// Issue links
		if (item.issues?.length) {
			listItem.createSpan({ text: ' (' });

			item.issues.forEach((issueNumber, index) => {
				if (index > 0) {
					listItem.createSpan({ text: ', ' });
				}

				const issueLink = listItem.createEl('a', {
					text: `#${String(issueNumber)}`,
					href: `${this.releaseNotes.repo}/issues/${String(issueNumber)}`,
					cls: 'ucf-issue-link',
				});
				issueLink.setAttr('target', '_blank');
			});

			listItem.createSpan({ text: ')' });
		}
	}

	/**
	 * Cleans up when the modal is closed.
	 */
	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Shows the What's New modal if the version has changed.
 *
 * @param app - Obsidian App instance
 * @param currentVersion - Current plugin version
 * @param lastSeenVersion - Last version the user saw
 * @param releaseNotes - Release notes data
 * @param delayMs - Delay before showing modal (default: 1000ms)
 * @returns True if the modal was shown
 */
export function showWhatsNewIfUpdated(
	app: App,
	currentVersion: string,
	lastSeenVersion: string,
	releaseNotes: ReleaseNotesData,
	delayMs = 1000
): boolean {
	if (lastSeenVersion === currentVersion) {
		return false;
	}

	// Small delay to ensure UI is ready
	setTimeout(() => {
		new WhatsNewModal(app, currentVersion, releaseNotes).open();
	}, delayMs);

	return true;
}
