/**
 * Recursively walks a loaded config and expands ${appLabel} placeholders
 * in any string value.
 *
 * Empty-label safe: when the label is the empty string, an adjacent single
 * space is also removed so the resulting text remains clean (e.g.
 * "${appLabel} Report" with an empty appLabel becomes "Report" rather
 * than " Report").
 */
export function applyLabelPlaceholders(
	config: Record<string, unknown> | undefined | null,
): void {
	if (!config) return;
	const appLabel = (config.appLabel as string) ?? "";

	const replaceKey = (s: string, key: string, value: string): string => {
		if (value === "") {
			return s
				.replace(new RegExp(`\\$\\{${key}\\} `, "g"), "")
				.replace(new RegExp(` \\$\\{${key}\\}`, "g"), "")
				.replace(new RegExp(`\\$\\{${key}\\}`, "g"), "");
		}
		return s.replace(new RegExp(`\\$\\{${key}\\}`, "g"), value);
	};
	const substitute = (input: string): string =>
		replaceKey(input, "appLabel", appLabel);

	const walk = (node: unknown): void => {
		if (node === null || node === undefined) return;
		if (Array.isArray(node)) {
			for (let i = 0; i < node.length; i++) {
				const v = node[i];
				if (typeof v === "string") node[i] = substitute(v);
				else if (typeof v === "object") walk(v);
			}
		} else if (typeof node === "object") {
			const obj = node as Record<string, unknown>;
			for (const key of Object.keys(obj)) {
				const v = obj[key];
				if (typeof v === "string") obj[key] = substitute(v);
				else if (typeof v === "object") walk(v);
			}
		}
	};
	walk(config);
}
