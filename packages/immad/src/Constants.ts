/**
 * Joins a configurable label (which may be the empty string) together with
 * surrounding text fragments, inserting a single space between non-empty
 * pieces. Designed for building user-facing strings out of an app/gate label
 * pulled from config where the label might legitimately be `""`.
 *
 * Examples:
 *   joinLabel('IMMAD', 'Administrator')       -> 'IMMAD Administrator'
 *   joinLabel('', 'Administrator')            -> 'Administrator'
 *   joinLabel('Save', 'GATE', 'Config')       -> 'Save GATE Config'
 *   joinLabel('Save', '', 'Config')           -> 'Save Config'
 */
export function joinLabel(...parts: Array<string | null | undefined>): string {
    return parts
        .map((p) => (p == null ? '' : String(p).trim()))
        .filter((p) => p.length > 0)
        .join(' ');
}
