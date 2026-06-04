/* All the global constants for GATE **/
const DEFAULT_SYSTEM_HIGH_CLASSIFICATION: string =
	"This page contains dynamic content - Highest Possible Classification is TOP SECRET//SI-G/TK//ORCON/NOFORN (SAMPLE ONLY)";
export { DEFAULT_SYSTEM_HIGH_CLASSIFICATION };

/**
 * Joins a configurable label (which may be the empty string) together with
 * surrounding text fragments, inserting a single space between non-empty
 * pieces. Designed for building user-facing strings out of an app label
 * pulled from config where the label might legitimately be `""`.
 *
 * Examples:
 *   joinLabel('GATE', 'Administrator')        -> 'GATE Administrator'
 *   joinLabel('', 'Administrator')            -> 'Administrator'
 *   joinLabel('Save', 'GATE', 'Config')       -> 'Save GATE Config'
 *   joinLabel('Save', '', 'Config')           -> 'Save Config'
 */
export function joinLabel(...parts: Array<string | null | undefined>): string {
	return parts
		.map((p) => (p == null ? "" : String(p).trim()))
		.filter((p) => p.length > 0)
		.join(" ");
}
