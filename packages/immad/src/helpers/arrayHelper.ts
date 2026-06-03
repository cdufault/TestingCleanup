/**
 * Compares two arrays, returns true if they are equal, false if not
 * @param a array 1
 * @param b  array 2
 */
export function arrayEquals(a: any[], b: any[]): boolean {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((val, index) => val === b[index]);
}
