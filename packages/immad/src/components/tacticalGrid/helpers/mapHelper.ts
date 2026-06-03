import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

/**
 * Queries features from a layer by field name
 * @param searchValue search value
 * @param gridLayer layer to query
 * @param fieldName field to query, defaults to objectid
 */
export default function queryFeaturesFromMapLayer(
    searchValue: string | number,
    ftrLayer: FeatureLayer,
    fieldName:string = 'objectid' 
): Promise<__esri.FeatureSet> {
    const query = ftrLayer.createQuery();
    const queryWhere = isNaN(Number(searchValue)) ? `${fieldName} = '${searchValue}'` : `${fieldName} = ${searchValue}`
    if (query) {
        query.where = queryWhere;
        query.outFields = ['*'];
    }
    console.log(queryWhere)
    return ftrLayer.queryFeatures(query);
}

/**
 * Queries features from a layer by object id array
 * @param objectids oid array to add to query
 * @param gridLayer layer to query
 */
export function queryFeaturesByArrayFromMapLayer(
    objectids: number[],
    gridLayer: FeatureLayer
): Promise<__esri.FeatureSet> {
    const query = gridLayer.createQuery();
    if (query) {
        query.where = `objectid IN (${objectids})`;
        query.outFields = ['*'];
    }
    return gridLayer.queryFeatures(query);
}
