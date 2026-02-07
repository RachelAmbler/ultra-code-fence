/**
 * Tests for src/services/icon-generator.ts
 *
 * Covers: calculateBadgeFontSize, generateFilledBadgeSvg,
 * generateOutlineBadgeSvg
 */

import { describe, it, expect } from 'vitest';
import {
	calculateBadgeFontSize,
	generateFilledBadgeSvg,
	generateOutlineBadgeSvg,
} from '../../src/services/icon-generator';

// =============================================================================
// calculateBadgeFontSize
// =============================================================================

describe('calculateBadgeFontSize', () => {
	it('returns 10 for single character', () => {
		expect(calculateBadgeFontSize(1)).toBe(10);
	});

	it('returns 8 for 2 characters', () => {
		expect(calculateBadgeFontSize(2)).toBe(8);
	});

	it('returns 7 for 3 characters', () => {
		expect(calculateBadgeFontSize(3)).toBe(7);
	});

	it('returns 6 for 4 characters', () => {
		expect(calculateBadgeFontSize(4)).toBe(6);
	});

	it('returns 5 for 5 characters', () => {
		expect(calculateBadgeFontSize(5)).toBe(5);
	});

	it('returns 5 for 6+ characters', () => {
		expect(calculateBadgeFontSize(6)).toBe(5);
		expect(calculateBadgeFontSize(10)).toBe(5);
	});

	it('returns 10 for zero length', () => {
		expect(calculateBadgeFontSize(0)).toBe(10);
	});
});

// =============================================================================
// generateFilledBadgeSvg
// =============================================================================

describe('generateFilledBadgeSvg', () => {
	it('returns a valid SVG string', () => {
		const svg = generateFilledBadgeSvg('JS', '#eab308');
		expect(svg).toContain('<svg');
		expect(svg).toContain('</svg>');
	});

	it('includes the label text', () => {
		expect(generateFilledBadgeSvg('PY', '#22c55e')).toContain('>PY<');
	});

	it('includes the background colour', () => {
		expect(generateFilledBadgeSvg('RS', '#b7410e')).toContain('fill="#b7410e"');
	});

	it('uses black text on yellow background', () => {
		const svg = generateFilledBadgeSvg('JS', '#eab308');
		expect(svg).toContain('fill="#000000"');
	});

	it('uses white text on non-yellow backgrounds', () => {
		const svg = generateFilledBadgeSvg('PY', '#22c55e');
		expect(svg).toContain('fill="#ffffff"');
	});

	it('uses white text on dark backgrounds', () => {
		const svg = generateFilledBadgeSvg('SH', '#4a4a4a');
		expect(svg).toContain('fill="#ffffff"');
	});

	// Font size via calculateBadgeFontSize (indirectly tested)
	it('uses font-size 10 for single character labels', () => {
		const svg = generateFilledBadgeSvg('C', '#2563eb');
		expect(svg).toContain('font-size="10"');
	});

	it('uses font-size 8 for 2-char labels', () => {
		const svg = generateFilledBadgeSvg('JS', '#eab308');
		expect(svg).toContain('font-size="8"');
	});

	it('uses font-size 7 for 3-char labels', () => {
		const svg = generateFilledBadgeSvg('SQL', '#8b5cf6');
		expect(svg).toContain('font-size="7"');
	});

	it('uses font-size 6 for 4-char labels', () => {
		const svg = generateFilledBadgeSvg('HTML', '#f97316');
		expect(svg).toContain('font-size="6"');
	});

	it('uses font-size 5 for 5+ char labels', () => {
		const svg = generateFilledBadgeSvg('SWIFT', '#f05138');
		expect(svg).toContain('font-size="5"');
	});

	it('uses font-size 5 for 6-char labels', () => {
		const svg = generateFilledBadgeSvg('DOCKER', '#0ea5e9');
		expect(svg).toContain('font-size="5"');
	});

	it('includes a rounded rectangle', () => {
		const svg = generateFilledBadgeSvg('GO', '#00add8');
		expect(svg).toContain('<rect');
		expect(svg).toContain('rx="4"');
	});

	it('has correct viewBox', () => {
		const svg = generateFilledBadgeSvg('TS', '#3178c6');
		expect(svg).toContain('viewBox="0 0 24 24"');
	});
});

// =============================================================================
// generateOutlineBadgeSvg
// =============================================================================

describe('generateOutlineBadgeSvg', () => {
	it('returns a valid SVG string', () => {
		const svg = generateOutlineBadgeSvg('TS');
		expect(svg).toContain('<svg');
		expect(svg).toContain('</svg>');
	});

	it('includes the label text', () => {
		expect(generateOutlineBadgeSvg('GO')).toContain('>GO<');
	});

	it('uses currentColor for text fill', () => {
		const svg = generateOutlineBadgeSvg('RB');
		expect(svg).toContain('fill="currentColor"');
	});

	it('uses currentColor for stroke', () => {
		const svg = generateOutlineBadgeSvg('RB');
		expect(svg).toContain('stroke="currentColor"');
	});

	it('has no filled background', () => {
		const svg = generateOutlineBadgeSvg('PY');
		expect(svg).toContain('fill="none"');
	});

	it('has semi-transparent stroke', () => {
		const svg = generateOutlineBadgeSvg('PY');
		expect(svg).toContain('opacity="0.5"');
	});

	// Font size (same logic as filled)
	it('uses font-size 8 for 2-char labels', () => {
		const svg = generateOutlineBadgeSvg('JS');
		expect(svg).toContain('font-size="8"');
	});

	it('uses font-size 5 for 5+ char labels', () => {
		const svg = generateOutlineBadgeSvg('SWIFT');
		expect(svg).toContain('font-size="5"');
	});

	it('has correct viewBox', () => {
		const svg = generateOutlineBadgeSvg('C');
		expect(svg).toContain('viewBox="0 0 24 24"');
	});
});
