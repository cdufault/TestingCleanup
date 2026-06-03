import PortalItem from '@arcgis/core/portal/PortalItem';
import {Classification, ClassificationItem, ClassificationMarking} from './interfaces/Classification';
import {RelToOptions} from './interfaces/RelToOptions';
import {ClassificationColor} from './interfaces/ClassificationColor';

const defaultPortalItem = new PortalItem({
    licenseInfo: `{"classification": "UNKNOWN"}`,
});

export const classifications: Classification[] = [
    { id: 0, label: 'UNKNOWN' },
    { id: 1, label: 'UNCLASSIFIED' },
    { id: 2, label: 'CONTROLLED' },
    { id: 3, label: 'CUI' },
    { id: 4, label: 'CONFIDENTIAL' },
    { id: 5, label: 'SECRET' },
    { id: 6, label: 'TOP SECRET' },
];

/**
 * Check to make sure classification is valid
 * @param classification original
 * @param classificationList list of valid options
 */
const validClassification = (classification: string, classificationList: Classification[]): boolean => {
    const foundClassification = classificationList?.find(
        (item) => item.label.toUpperCase() === classification.toUpperCase()
    );
    return !!foundClassification;
};

/**
 * Cleans the license info item and returns it without all the stringify items in it
 * @param originalLicenseInfo original license ifo object
 * @param classificationList list of classifications
 */
const cleanLicenseInfo = (originalLicenseInfo: string, classificationList: Classification[]): string | null => {
    let cleanLicenseInfo = null;
    if (originalLicenseInfo) {
        /**
         * In the case that someone puts classification information or text in the "Terms of Use"
         * we need to find the actual one that comes from the NGA tool
         */
        const matchedLicenseInfo = originalLicenseInfo.replace(/&quot;/g, '"').match(/{.*?}/g);
        if (matchedLicenseInfo && matchedLicenseInfo.length >= 1) {
            cleanLicenseInfo = matchedLicenseInfo[matchedLicenseInfo.length - 1];
        }

        if (cleanLicenseInfo) {
            const cleanJSON = JSON.parse(cleanLicenseInfo);
            if (!validClassification(cleanJSON.classification, classificationList)) {
                cleanLicenseInfo = defaultPortalItem.licenseInfo;
            }
        } else {
            cleanLicenseInfo = defaultPortalItem.licenseInfo;
        }
    } else {
        cleanLicenseInfo = defaultPortalItem.licenseInfo;
    }

    return cleanLicenseInfo;
};

/**
 * Opens a new tab to the portal item id passed in *
 * @param host like https://cigt-srv21.esri.tech/portal/
 * @param id portal item id to link to
 */
const createPortalLink = (host: string, id: string): string => {
    const itemHome = '/home/item.html?id=';
    return `https://${host}${itemHome}${id}`;
};

const filterOptions = (options: string[]): string[] => {
    // remove empty elements
    if (options.length > 0) {
        const nonEmptyOptions = options?.filter((option) => {
            return option !== '';
        });
        return nonEmptyOptions?.filter((item, index) => nonEmptyOptions.indexOf(item) === index) ?? [];
    }
    return options;
};

/**
 * Gets the classification banner color from a list of colors. The first element in the list is considered the "default/unknown" color.
 * @param classificationMarking // current marking
 * @param classificationConfigList // color list from config
 */
const getBannerColor = (
    classificationMarking: ClassificationMarking,
    classificationConfigList: ClassificationColor[]
): ClassificationColor => {
    let classificationColor: ClassificationColor = classificationConfigList[0];

    if (classificationMarking.classification) {
        const classificationConfig = classificationMarking?.sciOptions?.length
            ? classificationConfigList.find((x) => x.name === 'SCI')
            : classificationConfigList.find((x) => x.name === classificationMarking.classification);

        if (classificationConfig) {
            classificationColor = classificationConfig;
        }
    }

    return classificationColor;
};

/**
 * Gets the banner text based on all the caveats that have been established
 * @param classificationMarkingIn includes all current classification caveats
 * @param defaultClassification used to determine if the default text is needed
 * @param defaultBannerText the default text that will be used if needed
 */
const getBannerText = (
    classificationMarkingIn: ClassificationMarking,
    defaultClassification: Classification,
    defaultBannerText: string
): string => {
    // Proper order for classification string
    // CLASSIFICATION//SCI/SCI-SUBCONTROL//SAP//AEA//FGI//DISSEM/DISSEM//OTHER DISSEM
    // Example: SECRET//SI//ORCON/NOFORN/FISA

    let { classification, aeaOptions, sciOptions, fgiOptions, disseminationOptions, relToOptions } = classificationMarkingIn;
    if (classification === defaultClassification.label) {
        return defaultBannerText;
    }
    let bannerText = classification;

    // Call the helper functions
    if (sciOptions) {
        bannerText = addSciOptions(bannerText, sciOptions);
    }
    if(aeaOptions) {
        bannerText = addAeaOptions(bannerText, aeaOptions);
    }
    if (fgiOptions) {
        bannerText = addFgiOptions(bannerText, fgiOptions);
    }

    // Remove all aggregated dissemination options which are meant for UNCLASSIFIED only, if the aggregated marking is not UNCLASSIFIED.
    const unclassifiedOnlyMarkings = ['FOUO', 'LIMDIS', 'SBU', 'SBU NOFORN', 'LES', 'LES NOFORN', 'LAW ENFORCEMENT SENSITIVE', 'LAW ENFORCEMENT SENSITIVE NOFORN', 'DEA SENSITIVE'];

    if(classification !== 'UNCLASSIFIED') {
        disseminationOptions = disseminationOptions?.filter(item => !unclassifiedOnlyMarkings.includes(item)) ?? [];
    }

    /*
       Separates out Non-IC Dissemination Control Markings, to display them in separate section as required by CAPCO.
       Source: Public CAPCO Register and Manual v5.1, p. 25
    */
    const nonIcDissemMarkings: string[] = ['LIMDIS', 'EXDIS', 'NODIS', 'SBU', 'SBU NOFORN', 'LES NOFORN', 'LAW ENFORCEMENT SENSITIVE', 'LAW ENFORCEMENT SENSITIVE NOFORN', 'FOUO', 'SSI'];

    let markings: string[] = [];
    for(const marking of nonIcDissemMarkings) {
        if(disseminationOptions?.includes(marking)) {
            // Remove the marking from the IC dissemination options
            disseminationOptions = disseminationOptions?.filter(item => item !== marking);

            // Add it to the non-IC dissemination options list
            markings.push(marking);
        }
    }

    const nonIcDisseminationMarkingsPart = markings.join('/');

    if (classification && disseminationOptions && relToOptions) {
        bannerText = addDisseminationOptions(bannerText, classification, disseminationOptions, relToOptions);
    }

    if(markings.length > 0) {
        bannerText = `${bannerText}//${nonIcDisseminationMarkingsPart}`;
    }

    return bannerText;
};

/**
 * Add sci options to banner text
 * @param bannerText current banner text
 * @param sciOptions sci options to add
 */
const addSciOptions = (bannerText: string, sciOptions: string[]) => {
    if (sciOptions?.length) {
        const sortedOptions = sciOptions.sort();
        return `${bannerText}//${sortedOptions.join('/')}`;
    }
    return bannerText;
};

/**
 * Add sci options to banner text
 * @param bannerText current banner text
 * @param aeaOptions sci options to add
 */
const addAeaOptions = (bannerText: string, aeaOptions: string[]) => {
    if (aeaOptions?.length) {
        const sortedOptions = aeaOptions.sort();
        return `${bannerText}//${sortedOptions.join('/')}`;
    }
    return bannerText;
};

/**
 * Add fgi options to banner text
 * @param bannerText current banner text
 * @param fgiOptions fgi options to add
 */
const addFgiOptions = (bannerText: string, fgiOptions: string[]) => {
    if (fgiOptions?.length) {

        // if any option is CONCEALED, then only FGI must be shown
        if(fgiOptions.indexOf('CONCEALED') !== -1) {
            return `${bannerText}//FGI`
        }

        const sortedOptions = Array.from(new Set(fgiOptions)).sort();

        return `${bannerText}//FGI ${sortedOptions.join(' ')}`;
    }

    return bannerText;
};

/**
 * Add dissemination options to the banner text.
 * @param bannerText current banner text
 * @param classification current top level classification value
 * @param disseminationOptions the current dissemination options
 * @param relToOptions rel to options to handle 'REL TO' case in the dissemination options
 */
const addDisseminationOptions = (
    bannerText: string,
    classification: string,
    disseminationOptions: string[],
    relToOptions: string[]
) : string => {
    // in disseminationOptions FOUO and LIMDIS can not be used with anything but UNCLASSIFIED

    const noRelToDissemOpts = disseminationOptions.filter(item => !item.startsWith('REL TO'));

    let dissemOpts = [...new Set(noRelToDissemOpts ?? [])];
    let relToOpts = [...new Set(relToOptions ?? [])];

    let dissemOptsPart = '';

    if (classification !== 'UNCLASSIFIED') {
        dissemOpts = dissemOpts.filter((option) => option !== 'FOUO' && option !== 'LIMDIS');
    }

    if (dissemOpts.includes('NOFORN')) {
        relToOpts = [];  // clear out REL TO for NOFORN
    }

    if(relToOpts.length > 0) {
        if(!relToOpts.includes('USA')) {
            throw new Error("Error: REL TO must include USA as the first parameter.")
        }
        // REL TO must include country code USA as first country code and all others in alphabetical order
        relToOpts = relToOpts.filter(entry => entry !== 'USA').sort();
        const relToPart = 'REL TO USA, ' + relToOpts.join(', ');
        dissemOpts.push(relToPart);
    }

    dissemOpts = dissemOpts.sort();

    if(dissemOpts.length > 0) {
        dissemOptsPart = '//' + dissemOpts.join('/');
    }


    return `${bannerText}${dissemOptsPart}`;
};

/**
 * Gets the Classification for the classification banner by comparing classifications layer by layer
 * @param currentClassification
 * @param comparableClassification
 */
const getClassification = (
    currentClassification: Classification,
    comparableClassification?: Classification
): Classification => {
    if (currentClassification && comparableClassification && comparableClassification.id > currentClassification.id) {
        return comparableClassification;
    } else {
        return currentClassification;
    }
};

/**
 * Returns default classification
 */
const getDefaultClassificationMarking = (): ClassificationMarking => {
    const classifications = getClassificationList();
    return { classification: classifications[0].label, banner: classifications[0].label };
};

/**
 * Gets the Dissemination options for the classification banner based on the existing set and any that need to be added layer by layer
 * @param currentDisseminationOptions
 * @param newDisseminationOptions
 */
const getDisseminationOptions = (
    currentDisseminationOptions: string[],
    newDisseminationOptions: string[]
): string[] => {
    //make sure we only have unique values
    return filterOptions([...currentDisseminationOptions ?? [], ...newDisseminationOptions ?? []]);
};

/**
 * Gets the FGI options for the classification banner based on the existing set and any that need to be added layer by layer
 * @param currentFgiOptions
 * @param newFgiOptions
 */
const getFGIOptions = (currentFgiOptions: string[], newFgiOptions: string[]): string[] => {
    // make sure we only have unique values
    return filterOptions([...currentFgiOptions ?? [], ...newFgiOptions ?? []]);
};

const getClassificationList = (): Classification[] => {
    return [
        { id: 0, label: 'UNKNOWN' },
        { id: 1, label: 'UNCLASSIFIED' },
        { id: 2, label: 'CONFIDENTIAL' },
        { id: 3, label: 'SECRET' },
        { id: 4, label: 'TOP SECRET' },
    ];
};


/**
 * Apply the intersection of two arrays
 * @param a The first array
 * @param b The second array
 * @returns A new array with only common elements of A and B.
 */
const intersection = (a : string[], b : string[]) : string[] => {
    const setA = new Set(a);
    return b.filter((value : any) => setA.has(value));
}

/**
 *  Gets the REL TO options for the classification banner based on the existing set and any that need to be added layer by layer
 * @param classificationMarking
 * @param newRelToOptions
 * @param newDisseminationOptions
 */
const getRelToOptions = (
    classificationMarking: ClassificationMarking,
    newRelToOptions: string[],
    newDisseminationOptions: string[]
): RelToOptions => {

    let currentFgiOptions: string[]              = [ ...(classificationMarking.fgiOptions             ?? []) ];
    let disseminationOptions: string[]           = [ ...(classificationMarking.disseminationOptions   ?? []) ];
    let relToOptions: string[]                   = [ ...(classificationMarking.relToOptions           ?? []) ];

    const natoCountriesMinusUsa = [
        'ALB', // Albania
        'BEL', // Belgium
        'BGR', // Bulgaria
        'CAN', // Canada
        'HRV', // Croatia
        'CZE', // Czechia
        'DNK', // Denmark
        'EST', // Estonia
        'FIN', // Finland
        'FRA', // France
        'DEU', // Germany
        'GRC', // Greece
        'HUN', // Hungary
        'ISL', // Iceland
        'ITA', // Italy
        'LVA', // Latvia
        'LTU', // Lithuania
        'LUX', // Luxembourg
        'MNE', // Montenegro
        'NLD', // Netherlands
        'MKD', // North Macedonia
        'NOR', // Norway
        'POL', // Poland
        'PRT', // Portugal
        'ROU', // Romania
        'SVK', // Slovakia
        'SVN', // Slovenia
        'ESP', // Spain
        'SWE', // Sweden
        'TUR', // Turkey
        'GBR', // United Kingdom
        // USA is intentionally excluded in this list because it is not needed for comparison purposes
    ]
    if(newRelToOptions.length > 0 || relToOptions.length > 0) {
        // Expand NATO countries to their members for intersection comparisons
        if(relToOptions.includes('NATO')) {
            relToOptions = [ ...newRelToOptions.filter(item => item !== 'NATO'), ...natoCountriesMinusUsa ];
        }
        // Expand NATO countries to their members for intersection comparisons
        if(newRelToOptions.includes('NATO')) {
            newRelToOptions = [ ...newRelToOptions.filter(item => item !== 'NATO'), ...natoCountriesMinusUsa ];
        }
        // expand FVEY, ACGU and TEYE. Note that this removes the tetragraph from the list and replaces it with the constituent countries.
        // The countries are re-combined to FVEY later in the code, after comparisons are made.
        if(newRelToOptions.includes('FVEY')) {
            newRelToOptions = [ ...newRelToOptions.filter(item => item !== 'FVEY'), 'CAN', 'GBR', 'AUS', 'NZL' ];
        }
        else if(newRelToOptions.includes('ACGU')) {
            newRelToOptions = [ ...newRelToOptions.filter(item => item !== 'ACGU'), 'CAN', 'GBR', 'AUS' ];
        }
        else if(newRelToOptions.includes('TEYE')) {
            newRelToOptions = [ ...newRelToOptions.filter(item => item !== 'TEYE'), 'CAN', 'GBR' ];
        }

        // In this case, we intersect the new item's REL TO list with the existing list to find common REL TO countries.
        const intersectionOfRelTo = intersection(relToOptions, newRelToOptions);

        if (intersectionOfRelTo.length <= 1) // if length is 0 or 1 (USA), this signifies no common REL TO countries between the items.
        {
            relToOptions = [];

            /*

                IC handling for Defense Intelligence Components (DoDM 5200.01-V2 (8)(b) pg.91)

                "
                (a) Within the DoD, except for national intelligence information under the control of the Defense
                Intelligence Components, if a document contains portions of REL TO markings and portions with
                uncaveated information, the banner line shall contain only the U.S. classification... Additionally,
                for documents containing REL TO portions, if the document is not fully releasable to at least one
                country other than USA (i.e. there is no common country listed throughout the document's portions),
                the banner line shall reflect, in addition to any other requires caveats, simply the U.S.
                classification (i.e. the banner line shall not contain the REL TO marking. This marking standard
                shall be applied by the Defense Intelligence Components when the information is military intelligence."

                (b) Reference (k) requires intelligence under the purview of the DNI to be explicitly marked for
                foreign release. A combination of REL TO and uncaveated national intelligence information
                (i.e., information under purview of the DNI) is to be marked NOFORN in the banner line...
                likewise, where there is no common country listed in the REL TO portions, NOFORN is to be
                applied in the banner line."

                NOTE:There is some ambiguity here as to which sections to use (a) or (b), but for now we will err
                on the site of caution and use section (b), applying NOFORN.

             */
            disseminationOptions.push('NOFORN');
        }
        else {
            relToOptions = intersectionOfRelTo;

            //
            // // This is slow but necessary due to the current design of how we compare classifications
            const hasNato: boolean = natoCountriesMinusUsa.every(item => relToOptions.indexOf(item) !== -1);
            if(hasNato) {
                relToOptions = relToOptions.filter(item => !natoCountriesMinusUsa.includes(item));
                relToOptions.push('NATO');
            }

            // Check to see if FVEY countries are in result, to roll up 'FVEY' instead of expanded countries.
            const fvey = ['AUS', 'CAN', 'GBR', 'NZL']; // exclude USA as it is already present

            const hasFvey = fvey.every(item => relToOptions.indexOf(item) !== -1);
            if(hasFvey) {
                relToOptions = relToOptions.filter(item => !fvey.includes(item));
                relToOptions.push('FVEY');
            }

            const teye = ['AUS', 'CAN', 'GBR']; // exclude USA as it is already present
            const hasTeye = teye.every(item => relToOptions.indexOf(item) !== -1);
            if(hasTeye) {
                relToOptions = relToOptions.filter(item => !teye.includes(item));
                relToOptions.push('TEYE');
            }

        }
    }

    /* DODM 5200.01-V2 - p.64 - ENCLOSURE 4  - 9. (l)
        "REL TO cannot be used in the overall classification of a document containing FGI
        portions unless the entire document is releasable to all countries listed."

        This section clears out REL TO for the aggregate result if the current item is FGI and the incoming item is not releasable to all the countries listed
    */

    const newItemDisseminationOptions = newDisseminationOptions ?? [];
    if (currentFgiOptions?.length > 0 &&
        newItemDisseminationOptions.includes('REL TO')) {
        const containsAll = currentFgiOptions
            .every((element) => newItemDisseminationOptions.includes(element));
        if(!containsAll) {
            relToOptions = [];
        }
    }

    // combine dissemination options
    disseminationOptions = [ ...disseminationOptions, ...newItemDisseminationOptions ];
    disseminationOptions = [...filterOptions(disseminationOptions)];     // ensure unique

    /*  DODM 5200.01-V2 - p.64 - ENCLOSURE 4  - 9. (l)
        "When both NOFORN and REL TO information are included in the same document, NOFORN takes precedence over REL TO."
    */
    if(disseminationOptions.includes('NOFORN')) {
        relToOptions = [];
    }

    relToOptions         = [...filterOptions(relToOptions)]; // ensure unique

    return { relToOptions, disseminationOptions };
};

/**
 * Gets the SCI options for the classification banner based on the existing set and any that need to be added layer by layer
 * @param currentSciOptions
 * @param newSciOptions
 */
const getSCIOptions = (currentSciOptions: string[], newSciOptions: string[]): string[] => {
    return [ ...new Set([ ...(currentSciOptions ?? []), ...(newSciOptions ?? [])]) ].sort();
};

/**
 * Update license info object on portal item
 * @param portalItem item to update
 * @param updatedLicenseInfo new or updated license info object
 */
const updateLicenseInfo = (portalItem: PortalItem, updatedLicenseInfo: string): void => {
    if (portalItem) {
        portalItem.licenseInfo = updatedLicenseInfo;
    }
};

/**
 * Calculates the aggregate classification for a set of classification items. If a classification is unknown,
 * this method returns null
 * @param classificationItems
 * @param appConfigClassificationBanner
 */
const calculateHighestClassification = (
    classificationItems: ClassificationItem[],
    appConfigClassificationBanner: string
): ClassificationMarking | null => {
    if (!classificationItems || classificationItems.length === 0) {
        return null;
    }

    let classItems = [ ... classificationItems ];

    const firstMarking = classItems.shift() as ClassificationItem;

    if(!firstMarking) {
        return null;
    }

    let currentMarking = firstMarking.manualClassification ?? firstMarking.classification;

    if(!currentMarking) {
        return null;
    }

    currentMarking = { ... currentMarking } as ClassificationMarking;

    for (const item of classItems) {
        if (!item) continue;

        const itemClassification = (item.manualClassification ?? item.classification) as ClassificationMarking;

        if (!itemClassification) {
            // we have an unknown classification, so exit
            return null;
        }

        const oldClassification = currentMarking.classification;
        currentMarking.classification = getHighestClassification(currentMarking.classification, itemClassification.classification);

        if(oldClassification === 'SECRET' || oldClassification === 'CONFIDENTIAL' || oldClassification === 'TOP SECRET') {
            if(itemClassification.classification === 'SECRET' || itemClassification.classification === 'CONFIDENTIAL' || itemClassification.classification === 'TOP SECRET') {
                const relToOptions = getRelToOptions(currentMarking, itemClassification.relToOptions ?? [], itemClassification.disseminationOptions ?? []);
                currentMarking.relToOptions = relToOptions.relToOptions;
                currentMarking.disseminationOptions = relToOptions.disseminationOptions;
            }
            else {
                // comparison item is UNCLASSIFIED, so do nothing here
            }
        }
        else {
            // oldClassification is UNCLASSIFIED, so take the new item's relTo options
            currentMarking.relToOptions = itemClassification.relToOptions ?? [];
        }

        currentMarking.sciOptions = getSCIOptions(currentMarking.sciOptions ?? [], itemClassification.sciOptions ?? []);

        currentMarking.aeaOptions = [...new Set([ ...(currentMarking.aeaOptions ?? []), ...(itemClassification.aeaOptions ?? [])])].sort();

        currentMarking.fgiOptions = getFGIOptions(currentMarking.fgiOptions ?? [], itemClassification.fgiOptions ?? []);
        currentMarking.disseminationOptions = getDisseminationOptions(currentMarking.disseminationOptions ?? [], itemClassification.disseminationOptions ?? []);


    }

    currentMarking.banner = getBannerText(currentMarking, classifications[0], appConfigClassificationBanner);
    return currentMarking;
};

/**
 * compares two values of classification strings and returns the greater one
 * @param classStr1
 * @param classStr2
 */
const getHighestClassification = (classStr1: string, classStr2: string) => {
    if (!(classStr1 && classStr2)) {
        return '';
    }
    const class1 = classifications.find((item) => item.label === classStr1);
    const class2 = classifications.find((item) => item.label === classStr2);
    try {
        if (!class1 || !class2) {
            throw new Error('Classification cannot be calculated');
        }
        if (classifications.indexOf(class1) <= 0) {
            throw new Error('Unknown classification: ' + class1);
        }
        if (classifications.indexOf(class2) <= 0) {
            throw new Error('Unknown classification: ' + class2);
        }
    } catch (exception) {
        console.error('An error occurred getting the highest classification');
        console.error(exception);
        return '';
    }
    return class1.id > class2.id ? class1.label : class2.label;
};

/**
 * Update the classification calculation for the banner
 */
const updateClassificationCalculation = (
    classificationItems: ClassificationItem[],
    appConfigClassificationBanner: string
): ClassificationMarking | null => {
    return calculateHighestClassification(classificationItems, appConfigClassificationBanner);
};

/**
 * Tries the mission default manual classification from mission application item, if it has one.
 * Then this sets those values on the appropriate classification items.
 * @param classificationItems array of current classification items.
 * @param data the data object from the mission application
 */
const getDefaultManualClassification = async (classificationItems: ClassificationItem[], data: any) => {
    if (!data || !data.defaultManualClassification || data.defaultManualClassification.length === 0) {
        return; // No need to proceed further if data is missing or has no defaultManualClassification
    }
    const updatedArray = [...classificationItems];
    data.defaultManualClassification.forEach((defaultItem: any) => {
        const index = updatedArray.findIndex((item) => item.id === defaultItem.layerId);
        if (index !== -1) {
            updatedArray[index] = {
                ...updatedArray[index],
                manualClassification: defaultItem.licenseInfo,
            };
        }
    });
    return updatedArray;
};

/**
 * Sets manual classification for an item and updates the classification items list.
 * @param item The classification item to set a manual classification
 * @param classification The classification marking to set, or null to remove the manual classification.
 */
const setManualClassification = async (
    item: ClassificationItem,
    classification: ClassificationMarking | null
): Promise<ClassificationItem> => {
    // Create a new object with the updated manualClassification
    let updatedItem = { ...item, manualClassification: classification };
    // ensure we don't lose classification from the portal.
    if (item.classification) {
        updatedItem = { ...updatedItem, classification: item.classification };
    }
    return updatedItem;
};

export {
    cleanLicenseInfo,
    createPortalLink,
    getBannerText,
    getBannerColor,
    getClassification,
    getClassificationList,
    getDefaultClassificationMarking,
    getDisseminationOptions,
    getFGIOptions,
    getRelToOptions,
    getSCIOptions,
    updateLicenseInfo,
    updateClassificationCalculation,
    getDefaultManualClassification,
    setManualClassification,
};
