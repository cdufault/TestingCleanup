import React, {useEffect, useMemo, useState} from "react";
import Autocomplete from '@mui/material/Autocomplete'
import {Chip, IconButton, Stack, CircularProgress } from "@mui/material";
import StatisticDefinition from "@arcgis/core/rest/support/StatisticDefinition";
import Query from "@arcgis/core/rest/support/Query";
import DataMagnifyingGlassIcon from "calcite-ui-icons-react/DataMagnifyingGlassIcon";
import {FilterableLayer} from "../LayerFilter";
import Typography from "@mui/material/Typography";
import {InputField} from "../../../common";
import Paper from "@mui/material/Paper";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Layer = __esri.Layer;
import ImageryLayer = __esri.ImageryLayer;
import SQLNode = __esri.SQLNode;
import StringNode = __esri.StringNode;

interface AsyncFeatureValueProps
{
    node: StringNode;
    value: string,
    fieldName: string,
    layer : Layer,
    handleNodeUpdated: (node: SQLNode) => void;
}

/**
 * Feature Value element which provides a suggestion of values from Feature Service based on the input search term.
 * @param props
 * @constructor
 */
const AsyncFeatureValue = (props: AsyncFeatureValueProps): JSX.Element => {

    const { node, fieldName, layer } = props;

    const [open, setOpen] = useState(false);

    const [options, setOptions] = useState<readonly string[]>([]);

    const [isLoading, setIsLoading] = useState(false);

    const [inputValue, setInputValue] = useState<string>(node.value ?? '');

    const [resultOffset, setResultOffset] = useState<number>(0);

    const [resultCount, setResultCount] = useState<number>(0);

    const [exceededLimit, setExceededLimit] = useState<boolean>(false);

    const pageIncrement = 200;

    const abortController = new AbortController();

    useEffect(() => {
        setInputValue(node.value);
    }, [node]);

    useEffect(()=>{
        return () => {
            abortController.abort();
        }
    }, [fieldName]);

    useEffect(()=>{
        setIsLoading(false);
        setOpen(false);
        setResultOffset(0);
        setResultCount(0);
        setExceededLimit(false);

        node.value = inputValue;
        props.handleNodeUpdated(node);

    }, [inputValue]);

    function CustomPaper({ children, buttons, ...other } : any)
    {
        return (
            <Paper {...other}>
                {children}
                {buttons}
            </Paper>
        )
    }

    const buttons = useMemo(()=> {
            return (
                <Stack direction='column'>
                    {
                        open && resultCount > 0 &&
                        (exceededLimit ?
                            <Typography variant='caption'>Showing {1 + resultOffset} to {resultOffset + pageIncrement} of {resultCount} results</Typography>
                            :
                            <Typography variant='caption'>Showing {1 + resultOffset} to { Math.min(resultOffset + pageIncrement, resultCount) } of {resultCount} results</Typography>)
                    }

                    { !isLoading && open && resultCount === 0 && <Typography variant={'caption'}>`No results found which start with "{inputValue}".`</Typography>}
                    { open && <Typography variant='caption'> {isLoading ? 'Loading...' : `Search text: "${inputValue}"`}</Typography> }

                    <Stack direction='row' spacing={1} onMouseDown={event => event.preventDefault()}>
                        {
                            open && resultOffset > 0 && <Chip variant='outlined' label={'Prev'}
                                                              onClick={() => {
                                                                  searchData(inputValue, resultOffset - pageIncrement, abortController.signal);
                                                              }}
                            />
                        }
                        {
                            open && exceededLimit && <Chip variant='outlined' label={'Next'}
                                                           onClick={() => {
                                                               searchData(inputValue, resultOffset + pageIncrement, abortController.signal);
                                                           }}
                            />
                        }
                    </Stack>
                </Stack>);
        }
        , [open, exceededLimit, resultOffset, resultCount, isLoading]);

    /**
     * Searches the Feature Layer for field value data, given a search string and result offset, and optional abort signal.
     */
    const searchData = (searchText: string, resultOffset : number, abortSignal? : AbortSignal) => {
        let active = true;

        const offset = resultOffset < 0 ? 0 : resultOffset;

        if(!isLoading && fieldName && layer) {
            layer.load().then(() => {
                if (active) {

                    const queryableLayer = layer as Exclude<FilterableLayer, ImageryLayer>;

                    if(queryableLayer?.capabilities?.query?.supportsStatistics) {
                        const countFieldName = fieldName + "__count";
                        const statisticsDef = {
                            outStatisticFieldName: countFieldName,
                            onStatisticField: fieldName,
                            statisticType: "count"
                        } as StatisticDefinition;
                        const escapedInputValue = searchText.replace("'", "''").toUpperCase();
                        const whereClause = searchText ? `UPPER(${fieldName}) LIKE '${escapedInputValue.toUpperCase()}%'` : '1=1';

                        const countQuery = new Query({
                            where: whereClause,
                            outFields: [fieldName],
                            groupByFieldsForStatistics: [fieldName],
                            outStatistics: [statisticsDef],
                            returnDistinctValues: true,
                        });

                        const statQuery = new Query({
                            where: whereClause,
                            outFields: [fieldName],
                            groupByFieldsForStatistics: [ fieldName ],
                            orderByFields: [`${fieldName} ASC`],
                            outStatistics: [ statisticsDef ],
                        });


                        // STBDS does not support pagination on statistics aggregations, so we make it optional
                        const featLayer = layer as FeatureLayer;
                        const supportsPaginationOnAggregatedQueries = featLayer?.sourceJSON
                            .advancedQueryCapabilities?.supportsPaginationOnAggregatedQueries as boolean;
                        if(supportsPaginationOnAggregatedQueries) {
                            statQuery.num = pageIncrement;
                            statQuery.start = offset;
                            setResultOffset(offset);
                        }

                        setIsLoading(true);

                        queryableLayer.queryFeatureCount(countQuery, {signal: abortSignal})
                            .then(resultCount => {
                                setResultCount(resultCount);
                                queryableLayer.queryFeatures(statQuery, { signal: abortSignal } )
                                    .then(result => {

                                        const options = result.features
                                            .filter(graphic => graphic.getAttribute(countFieldName) > 0)
                                            .map(feature => {
                                                return `${feature.getAttribute(fieldName)}`;
                                            });

                                        setOptions(options);
                                        setExceededLimit(result.exceededTransferLimit);
                                        setIsLoading(false);
                                        setOpen(true);
                                }).catch(error => {
                                    console.error(error.message);
                                    setIsLoading(false);
                                });
                        }).catch(error => {
                            console.error(error.message);
                            setIsLoading(false);
                        });
                    }
                }
            }).catch(error => {
                console.error(error.message);
                setIsLoading(false);
            });
        }

        return () => { active = false; };
    };

    useEffect(()=>{
        if(!open) {
            setOptions([]);
            setResultCount(0);
            setResultOffset(0);
        }
    }, [open])


    useEffect(()=>{
        setOptions([]);
    }, [fieldName])

    return (
        <Autocomplete
            freeSolo
            open={open}
            size='small'
            options={options}
            loading={isLoading}
            value={inputValue}
            loadingText={`Searching for values starting with '${inputValue}' ... `}
            noOptionsText={'No items found with this search term.'}
            PaperComponent={CustomPaper}
            componentsProps={{ paper: { buttons: buttons }}}
            filterOptions={(options) => options}
            onClose={() => setOpen(false)}
            onInputChange={(e, value) => {
                setInputValue(value);
            }}
            fullWidth
            renderInput={(params) => (
                <InputField {...params}
                        size='small'
                        title={inputValue}
                        InputProps={{
                                 ...params.InputProps,
                                 endAdornment: (
                                     <>
                                         {isLoading && <CircularProgress size={14} /> }
                                         <IconButton
                                             size='small'
                                             disableRipple
                                             disabled={isLoading} title={"Search for values"}
                                             onClick={() => searchData(inputValue, 0, abortController.signal)}>
                                             <DataMagnifyingGlassIcon size={14}/>
                                         </IconButton>
                                         { params.InputProps.endAdornment }
                                     </>
                                 )
                             }}
                />
            )}
        />
    );
}


export default AsyncFeatureValue;