import { IItem } from '@esri/arcgis-rest-portal';
import { SortDirection } from './interfaces';

/**
 * Find all scenes whose title contains the search/filter string
 * @param filterString string to search for
 * @param scenes array of scenes
 */
export function filterScenesByTitle(filterString: string, scenes: IItem[]): IItem[] {
    const filteredScenes = scenes.filter((scene) => {
        return scene.title.toLowerCase().includes(filterString.toLowerCase());
    });
    return filteredScenes;
}

/**
 * Sort ImmadAnalyst type objects
 * @param a IItem A
 * @param b IItem B
 * @param searchField object property to search on
 * @param dir sort direction
 */
export function compareScenes(
    a: IItem,
    b: IItem,
    searchField: string,
    dir: SortDirection = 'ASC',
    fieldType = 'string'
): number {
    if (!a || !b) {
        return 1;
    }

    const propA = a[searchField as keyof IItem]
        ? a[searchField as keyof IItem]
        : fieldType === 'string'
        ? 'zzzz'
        : Number.MAX_SAFE_INTEGER; //push empty fields to the end
    const propB = b[searchField as keyof IItem]
        ? b[searchField as keyof IItem]
        : fieldType === 'string'
        ? 'zzzz'
        : Number.MAX_SAFE_INTEGER;
    const propAToLower = fieldType === 'number' ? propA : propA.toLowerCase().trim();
    const propBToLower = fieldType === 'number' ? propB : propB.toLowerCase().trim();
    if (propAToLower >= propBToLower) {
        if (dir === 'ASC') {
            return 1;
        } else {
            return -1;
        }
    } else if (dir === 'ASC') {
        return -1;
    }
    return 1;
}
