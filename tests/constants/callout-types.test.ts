import { describe, it, expect } from 'vitest';
import {
    normalizeCalloutType,
    getCalloutColor,
    getCalloutIcon,
    CALLOUT_TYPE_ALIASES,
    CALLOUT_TYPE_COLORS,
    CALLOUT_TYPE_ICONS,
} from '../../src/constants/callout-types';

describe('normalizeCalloutType', () => {
    describe('canonical types', () => {
        it('returns canonical type names as-is', () => {
            expect(normalizeCalloutType('note')).toBe('note');
            expect(normalizeCalloutType('warning')).toBe('warning');
            expect(normalizeCalloutType('bug')).toBe('bug');
        });
    });

    describe('aliases', () => {
        it('resolves summary to abstract', () => {
            expect(normalizeCalloutType('summary')).toBe('abstract');
        });

        it('resolves tldr to abstract', () => {
            expect(normalizeCalloutType('tldr')).toBe('abstract');
        });

        it('resolves hint to tip', () => {
            expect(normalizeCalloutType('hint')).toBe('tip');
        });

        it('resolves important to tip', () => {
            expect(normalizeCalloutType('important')).toBe('tip');
        });

        it('resolves check to success', () => {
            expect(normalizeCalloutType('check')).toBe('success');
        });

        it('resolves done to success', () => {
            expect(normalizeCalloutType('done')).toBe('success');
        });

        it('resolves help to question', () => {
            expect(normalizeCalloutType('help')).toBe('question');
        });

        it('resolves faq to question', () => {
            expect(normalizeCalloutType('faq')).toBe('question');
        });

        it('resolves caution to warning', () => {
            expect(normalizeCalloutType('caution')).toBe('warning');
        });

        it('resolves attention to warning', () => {
            expect(normalizeCalloutType('attention')).toBe('warning');
        });

        it('resolves fail to failure', () => {
            expect(normalizeCalloutType('fail')).toBe('failure');
        });

        it('resolves missing to failure', () => {
            expect(normalizeCalloutType('missing')).toBe('failure');
        });

        it('resolves error to danger', () => {
            expect(normalizeCalloutType('error')).toBe('danger');
        });

        it('resolves task to todo', () => {
            expect(normalizeCalloutType('task')).toBe('todo');
        });

        it('resolves cite to quote', () => {
            expect(normalizeCalloutType('cite')).toBe('quote');
        });

        it('resolves snippet to example', () => {
            expect(normalizeCalloutType('snippet')).toBe('example');
        });

        it('resolves information to info', () => {
            expect(normalizeCalloutType('information')).toBe('info');
        });
    });

    describe('case-insensitive', () => {
        it('converts uppercase to lowercase', () => {
            expect(normalizeCalloutType('WARNING')).toBe('warning');
            expect(normalizeCalloutType('Tip')).toBe('tip');
            expect(normalizeCalloutType('CAUTION')).toBe('warning');
        });
    });

    describe('unknown types', () => {
        it('passes through unknown types as lowercase', () => {
            expect(normalizeCalloutType('custom')).toBe('custom');
            expect(normalizeCalloutType('UNKNOWN')).toBe('unknown');
        });
    });
});

describe('getCalloutColor', () => {
    describe('known types', () => {
        it('returns rgb string for note', () => {
            expect(getCalloutColor('note')).toBe('rgb(68, 138, 255)');
        });

        it('returns rgb string for warning', () => {
            expect(getCalloutColor('warning')).toBe('rgb(236, 117, 0)');
        });

        it('returns rgb string for success', () => {
            expect(getCalloutColor('success')).toBe('rgb(59, 198, 89)');
        });

        it('returns rgb string for danger', () => {
            expect(getCalloutColor('danger')).toBe('rgb(233, 49, 71)');
        });

        it('returns rgb string for example', () => {
            expect(getCalloutColor('example')).toBe('rgb(120, 82, 238)');
        });

        it('returns rgb string for quote', () => {
            expect(getCalloutColor('quote')).toBe('rgb(158, 158, 158)');
        });
    });

    describe('unknown types', () => {
        it('falls back to note colour for unknown types', () => {
            expect(getCalloutColor('custom')).toBe('rgb(68, 138, 255)');
            expect(getCalloutColor('UNKNOWN')).toBe('rgb(68, 138, 255)');
        });
    });
});

describe('getCalloutIcon', () => {
    describe('known types', () => {
        it('returns string containing svg for known types', () => {
            const knownTypes = Object.keys(CALLOUT_TYPE_ICONS);
            knownTypes.forEach((type) => {
                const icon = getCalloutIcon(type);
                expect(icon).toContain('<svg');
                expect(icon).not.toBe('');
            });
        });

        it('returns non-empty string for each canonical type', () => {
            const canonicalTypes = [
                'note',
                'abstract',
                'info',
                'tip',
                'success',
                'question',
                'warning',
                'failure',
                'danger',
                'bug',
                'example',
                'quote',
                'todo',
            ];
            canonicalTypes.forEach((type) => {
                const icon = getCalloutIcon(type);
                expect(icon).not.toBe('');
                expect(icon).toContain('<svg');
            });
        });
    });

    describe('unknown types', () => {
        it('falls back to note icon for unknown types', () => {
            const noteIcon = getCalloutIcon('note');
            const customIcon = getCalloutIcon('custom');
            expect(customIcon).toBe(noteIcon);
        });
    });
});
