/**
 * Ultra Code Fence - Callout Type Definitions
 *
 * Maps Obsidian callout types to colours and Lucide-style SVG icons.
 * Supports the full set of built-in types plus aliases.
 */

/**
 * Maps callout type aliases to their canonical types.
 * Allows for flexible type naming while normalizing to a standard set.
 */
export const CALLOUT_TYPE_ALIASES: Record<string, string> = {
    summary: 'abstract',
    tldr: 'abstract',
    hint: 'tip',
    important: 'tip',
    check: 'success',
    done: 'success',
    help: 'question',
    faq: 'question',
    caution: 'warning',
    attention: 'warning',
    fail: 'failure',
    missing: 'failure',
    error: 'danger',
    task: 'todo',
    cite: 'quote',
    snippet: 'example',
    information: 'info',
};

/**
 * RGB colour values matching Obsidian's default callout styling.
 * Stored as [red, green, blue] tuples for efficient colour manipulation.
 */
export const CALLOUT_TYPE_COLORS: Record<string, [number, number, number]> = {
    note: [68, 138, 255],
    abstract: [0, 191, 188],
    info: [68, 138, 255],
    tip: [0, 191, 188],
    success: [59, 198, 89],
    question: [236, 117, 0],
    warning: [236, 117, 0],
    failure: [233, 49, 71],
    danger: [233, 49, 71],
    bug: [233, 49, 71],
    example: [120, 82, 238],
    quote: [158, 158, 158],
    todo: [68, 138, 255],
};

/**
 * SVG icons for each callout type, using Lucide icon design.
 * All icons use a 24x24 viewBox and currentColor for consistent styling.
 * Sized to fit within typical icon containers while maintaining clarity.
 */
export const CALLOUT_TYPE_ICONS: Record<string, string> = {
    note: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="2" x2="22" y2="6"/><path d="M7.5 20.5 19 9l-4-4L3.5 16.5 2 22z"/></svg>',
    abstract: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    tip: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    success: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    question: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    failure: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
    danger: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    bug: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>',
    example: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    quote: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 6H3"/><path d="M21 12H8"/><path d="M21 18H8"/><path d="M3 12v6"/></svg>',
    todo: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>',
};

/**
 * Normalize a raw callout type string to its canonical form.
 *
 * Converts the input to lowercase and resolves known aliases to their
 * canonical type names. Unknown types pass through as lowercase strings.
 *
 * @param rawType - The raw callout type string (case-insensitive)
 * @returns The normalized canonical type name
 *
 * @example
 * normalizeCalloutType('WARNING') // 'warning'
 * normalizeCalloutType('summary') // 'abstract'
 * normalizeCalloutType('custom') // 'custom'
 */
export function normalizeCalloutType(rawType: string): string {
    const lower = rawType.toLowerCase();
    return CALLOUT_TYPE_ALIASES[lower] ?? lower;
}

/**
 * Get the RGB colour string for a callout type.
 *
 * Returns an rgb() colour string matching Obsidian's default styling.
 * Falls back to the note colour for unknown types.
 *
 * @param type - The normalized callout type
 * @returns An rgb(...) colour string
 *
 * @example
 * getCalloutColor('warning') // 'rgb(236, 117, 0)'
 * getCalloutColor('unknown') // 'rgb(68, 138, 255)'
 */
export function getCalloutColor(type: string): string {
    const rgb = CALLOUT_TYPE_COLORS[type] ?? CALLOUT_TYPE_COLORS.note;
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

/**
 * Get the SVG icon for a callout type.
 *
 * Returns a Lucide-style SVG icon string for visual representation.
 * Falls back to the note icon for unknown types.
 *
 * @param type - The normalized callout type
 * @returns An SVG element string
 *
 * @example
 * getCalloutIcon('warning') // '<svg ...>...</svg>'
 * getCalloutIcon('unknown') // Uses note icon
 */
export function getCalloutIcon(type: string): string {
    return CALLOUT_TYPE_ICONS[type] ?? CALLOUT_TYPE_ICONS.note;
}
