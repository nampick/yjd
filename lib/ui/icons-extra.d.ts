/**
 * Extra icons — the Editor UI 2.0 additions to the icon family (opt-in).
 * Import and call `registerExtraIcons()` to add them to the shared registry.
 */

/** Map of icon name → inline SVG string (24×24, 1.75 stroke, currentColor). */
export declare const extraIcons: Record<string, string>;

/**
 * Register the extra icon set (or a named subset) into the shared registry.
 * @param names Register only these keys; omit for all.
 */
export declare function registerExtraIcons(names?: string[]): void;

export default registerExtraIcons;
