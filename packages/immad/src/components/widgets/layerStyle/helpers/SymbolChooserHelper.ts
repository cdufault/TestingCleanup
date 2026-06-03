import { getPortalItemData } from '../../../../helpers/portalItemsHelper';
import EsriConfig from '@arcgis/core/config';
import { ConfigHelper } from '../../../../helpers/configHelper';

/**
 * Represents a Custom Stratcom Symbol
 */
export interface StratcomSymbol {
    name: string;
    title: string;
    thumbnailHref: string;
    href: string;
    styleUrl: string;
}

/**
 * Color ramp tags for displaying different color sets.
 */
export const COLOR_RAMP_TAGS: string[] = ['blues', 'grays', 'greens', 'oranges', 'pinks', 'purples', 'reds', 'yellows'];

/**
 * Retrieves the STRATCOM custom 3D symbol set from the AppConfig symbolSetId
 */
export async function getStratComSymbolSet(): Promise<Array<StratcomSymbol>> {
    const appConfig = await ConfigHelper.loadAppConfig();
    const symbolSetId = appConfig.symbolItemId;

    const result = await getPortalItemData(symbolSetId); //json data
    const items: StratcomSymbol[] = [];
    if (result) {
        if (result.items) {
            result.items.map((item: any) => {
                const newSymbol: StratcomSymbol = {
                    name: item.name,
                    title: item.title,
                    thumbnailHref:
                        EsriConfig.portalUrl +
                        '/sharing/rest/content/items/' +
                        symbolSetId +
                        '' +
                        item.thumbnail.href.split('.')[1] +
                        '.png',
                    href:
                        EsriConfig.portalUrl +
                        '/sharing/rest/content/items/' +
                        symbolSetId +
                        '/resources/styles/gltf/resource/' +
                        item.name +
                        '.glb',
                    styleUrl: EsriConfig.portalUrl + '/sharing/rest/content/items/' + symbolSetId + '/data',
                };
                items.push(newSymbol);
            });
        }
        return items;
    } else {
        return items;
    }
}
