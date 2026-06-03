/**
 * Types of RKS searches.
 */
export enum RKSSearchType {
    RKS_Operator_Group_Search = 'operator_group',
    RKS_Global_String_Search = 'global_string_search',
    RKS_Entity_Type_Search = 'entity_type_search',
    RKS_Field_String_Search = 'field_string_search',
    RKS_Dataset_Search = 'dataset_search',
    RKS_Entity_Id_Search = 'entity_id_search',
    RKS_Geo_Bounding_Box_Search = 'geo_bounding_box_search',
    RKS_Last_Updated_Search = 'last_updated_search',
    TEST = 'test',
}

/**
 * Types of RKS entities available when generating mock data.
 */
export enum RKSEntityType {
    VEHICLE = 'vehicle',
    VEHICLE_REF = 'vehicle_ref',
}

/**
 * Components that comprise an RKS operator group search.
 */
export interface RKSOperatorSearch {
    search: {
        _searchType: RKSSearchType;
        and?: RKSEntityBaseSearchElements[];
        or?: RKSEntityBaseSearchElements[];
        not?: RKSEntityBaseSearchElements[];
    };
    searchOptions: RKSSearchOptions;
    aggs?: RKSAggs;
}

export interface RKSDetailSearchStructure {
    entityId: string[];
    detailType?: string[];
    elementType?: string[];
    searchOptions?: RKSSearchOptions;
    aggs?: RKSAggs;
}
/**
 * The structure and, or, not portions of a RKS operator group search
 */
export interface RKSEntityBaseSearchElements {
    _searchType?: RKSSearchType;
    search?: string;
    entityId?: string[];
    entityTypes?: string[];
    detailType?: string[];
    elementType?: string[];
    datasets?: string[];
    top?: number;
    bottom?: number;
    right?: number;
    left?: number;
    before?: string;
    after?: string;
}

/**
 * The options element of an RKS search
 */
export interface RKSSearchOptions {
    sort?: string;
    order?: string;
    scrollId?: string;
    from?: number;
    size: number;
}

/**
 * Data structure to hold the parsed results of an RKS details search + the post request sent to the server.
 */
export interface parsedRKSSearchResult {
    resultData: Map<string, preFeatureObj>;
    recordCountPerEntityIdMap: Map<string, number>;
    entityIdArray?: string[];
    postRequest?: RKSOperatorSearch | RKSDetailSearchStructure;
    scrollId?: string;
    totalCount?: number;
    numberOfDetailsNotProcessed?: number;
}

/**
 * Aggregation component of an RKS search
 */
export interface RKSAggs {
    entityTypes?: boolean;
    nationalities?: boolean;
    datasets?: boolean;
}
/**
 * The result object in the result array when doing an RKS entity metadata search.
 * This item will hold additional properties that will be flushed out later.
 */
export interface resultEntity {
    entityId: string;
    entityType: string;
}

/**
 * Result item for the result array returned in the entity search
 */
export interface resultItem {
    score: number;
    entity: resultEntity;
}

/**
 * Result structure returned by RKS search that can be used for moving relevant parts of query result between method calls
 */
export interface rksPostSearchResult {
    //id: string;
    scrollId?: string;
    totalCount: number;
    results?: resultItem[];
    details?: resultDetail[];
}

/**
 * Stucture of the date item in RKS search results
 */
export interface dateObj {
    insertDate: number;
    lastUpdated: number;
    lastUpdateRolledUp?: number;
}

/**
 * A collection of modified resultDetailElement items in a detail search result that comprises the element array
 */
export interface resultDetailElement {
    type: string;
    value: string;
}

/**
 * The stucture of the result object when doing an RKS details search
 */
export interface resultDetail {
    detailId: string;
    access: Access;
    dates: dateObj;
    entityId: string;
    entityType: string;
    detailType: string;
    elements: resultDetailElement[];
    dataset?: string;
    hasGeometry?: boolean;
}

/**
 * Classification component of an RKS search.
 */
export interface Access {
    classification: string;
    edhControlSet: string[];
}

/**
 * Data structure for holding parsed out detail search result. Object will be converted into a  feature.
 */
export interface preFeatureObj {
    elements?: preFeatureObjElement[]; //map<string, pre...>
    access: string;
    dataset: string;
    entityId: string;
    entityType: string;
    hasGeometry?: boolean;
    OBJECTID?: number;
    recordCount?: number;
    lastUpdated?: number;
}

/**
 * A collection of modified resultDetailElement items in a detail search result that comprises the element array updated with the date and detailId
 * This item is a temporary container when parsing detail search results.
 */
export interface preFeatureObjElement {
    type: string;
    value: string;
    date: string;
    detailId: string;
}

/**
 * Simple renderer.
 */
export interface simpleFtrRendererProps {
    type?: string;
    symbol: {
        color: string | number[];
        size: number;
        style?: string;
        type?: string;
    };
}
