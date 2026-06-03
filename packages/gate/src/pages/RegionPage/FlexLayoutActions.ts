/**Default flex layout attributes applicable to all layouts */
export const defaultUpdateModelActionAttributes = {
    tabEnableClose: true,
    splitterSize: 10,
    tabSetTabStripHeight: 25,
    tabCloseType: 3,
};

/**
 * Get the custom flex layout updateModelActionAttributes defined for a specific region
 * @param regionId id for the region or undefined
 */
export function getCustomUpdateModelActionAttributes(regionId: string | undefined): any {
    switch (regionId) {
        case 'SomeRegionId': {
            return {
                //object {paramName:string, paramValue:any}
            };
        }
        default: {
            return {};
        }
    }
}
