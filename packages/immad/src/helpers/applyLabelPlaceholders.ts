/**
 * Recursively walks a loaded config and expands ${appLabel} and ${gateLabel}
 * placeholders in any string value.
 *
 * Empty-label safe: when a label is the empty string, an adjacent single
 * space is also removed so the resulting text remains clean (e.g.
 * "${gateLabel} Report" with an empty gateLabel becomes "Report" rather
 * than " Report").
 *
 * Labels are looked up in this order:
 *   - appLabel:  config.appLabel
 *   - gateLabel: config.gateLabel ?? config.gate?.gateLabel
 */
export function applyLabelPlaceholders(
	config: Record<string, unknown> | undefined | null,
): void {
	if (!config) return;
	const appLabel = (config.appLabel as string) ?? "";
	const topGate = (config.gateLabel as string | undefined) ?? undefined;
	const nestedGate = (config.gate as Record<string, unknown> | undefined)
		?.gateLabel as string | undefined;
	const gateLabel = topGate ?? nestedGate ?? "";

	const replaceKey = (s: string, key: string, value: string): string => {
		if (value === "") {
			return s
				.replace(new RegExp(`\\$\\{${key}\\} `, "g"), "")
				.replace(new RegExp(` \\$\\{${key}\\}`, "g"), "")
				.replace(new RegExp(`\\$\\{${key}\\}`, "g"), "");
		}
		return s.replace(new RegExp(`\\$\\{${key}\\}`, "g"), value);
	};
	const substitute = (input: string): string => {
		let result = replaceKey(input, "gateLabel", gateLabel);
		result = replaceKey(result, "appLabel", appLabel);
		return result;
	};

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
