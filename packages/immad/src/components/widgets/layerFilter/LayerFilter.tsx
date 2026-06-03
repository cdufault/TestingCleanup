import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import LayerSelect from '../../common/layerSelect';
import { ActionButton, InputGroup, WidgetActions, WidgetContainer, WidgetContent, WidgetHeader } from '../../common';
import { LogHelper } from '../../../helpers/logHelper';
import ScriptIcon from 'calcite-ui-icons-react/ScriptIcon';
import { Alert, TextField } from '@mui/material';
import * as sql from '@arcgis/core/core/sql';
import { FilterBinaryOperator } from './components/FilterBinaryOperator';
import { FeatureSelectionContext, SelectionMode } from '../../../contexts/FeatureSelectionContext';
import { useSnackbar } from 'notistack';
import { StyledInlineToggleButton, useStyles } from './styles';
import { MapContext } from '../../../contexts/Map';
import FilterIcon from 'calcite-ui-icons-react/FilterIcon';
import SelectionFilterIcon from 'calcite-ui-icons-react/SelectionFilterIcon';
import LayerFilterIcon from 'calcite-ui-icons-react/LayerFilterIcon';
import EraseIcon from 'calcite-ui-icons-react/EraseIcon';
import ResetIcon from 'calcite-ui-icons-react/ResetIcon';
import { tryToConvertFeatureLayerToSublayer } from '../../../helpers/layerFilterHelper';
import { FilterTimeExpression } from './components/FilterTimeExpression';
import { getWhereClause } from './helpers/filterOperations';

export type FilterableLayer = FeatureLayer | SceneLayer | GeoJSONLayer | CSVLayer | WFSLayer | ImageryLayer;

const supportedTypes: string[] = ['feature', 'imagery', 'scene', 'wfs', 'geojson', 'csv'];

import FeatureLayer = __esri.FeatureLayer;
import ImageryLayer = __esri.ImageryLayer;
import WFSLayer = __esri.WFSLayer;
import CSVLayer = __esri.CSVLayer;
import GeoJSONLayer = __esri.GeoJSONLayer;
import SceneLayer = __esri.SceneLayer;
import SQLNode = __esri.SQLNode;
import BinaryNode = __esri.BinaryNode;
import WatchHandle = __esri.WatchHandle;

/**
 * The highest level component for the layer filtering capability.
 */
const LayerFilter = (): JSX.Element => {
    const [error] = useState<boolean>(false);

    const [selectedLayer, setSelectedLayer] = useState<FilterableLayer | undefined>();

    const [isSQLView, setIsSQLView] = useState<boolean>(false);

    const [isDebugView, setIsDebugView] = useState<boolean>(false);

    const [isValidSQL, setIsValidSQL] = useState<boolean>(true);

    const [sqlText, setSQLText] = useState<string>();

    const [definitionExpression, setDefinitionExpression] = useState<string>();

    const [parseTree, setParseTree] = useState<SQLNode | null>(null);

    const [updateParseTree, setUpdateParseTree] = useState<[]>();

    const [filterUpdated, setFilterUpdated] = useState<boolean>(false);
    const [selectionMessage, setSelectionMessage] = useState<string>();

    const { map, activeView, getMapView, getSceneView } = useContext(MapContext);

    const [selectedFeatures, setSelectedFeatures] = useState<number[] | null>(null);

    const { setSelectionData } = useContext(FeatureSelectionContext);

    const { enqueueSnackbar } = useSnackbar();

    const classes = useStyles();

    useEffect(() => {
        if (selectedFeatures !== null) {
            setSelectionMessage(`Select by Filter returned ${selectedFeatures.length} features.`);
        } else {
            setSelectionMessage('');
        }
    }, [selectedFeatures]);

    useEffect(() => {
        try {
            if (parseTree) {
                const sqlText = getWhereClause(parseTree);
                setSQLText(sqlText);
            } else {
                setSQLText('');
            }
        } catch (e) {
            LogHelper.log(e.message, false);
        }
    }, [parseTree]);

    /**
     * Debounces update to parseTree
     */
    useEffect(() => {
        const handler = setTimeout(() => {
            setParseTree((parseTree) => {
                return { ...parseTree } as BinaryNode;
            });
        }, 10);
        return () => clearTimeout(handler);
    }, [updateParseTree]);

    useEffect(() => {
        if (selectedLayer) {
            const handle = selectedLayer.watch('definitionExpression', (newValue, oldValue) => {
                if (oldValue !== newValue) {
                    setDefinitionExpression(newValue);

                    if (selectedLayer.type === 'feature' && selectedLayer?.SUBLAYER_PARENT) {
                        const sublayer = tryToConvertFeatureLayerToSublayer(selectedLayer);
                        if (sublayer) {
                            sublayer.definitionExpression = newValue;
                        }
                    }
                }
            });

            // Watch external changes to the parent sublayer, if it exists.
            let sublayerHandle: WatchHandle;
            if (selectedLayer.type === 'feature' && selectedLayer?.SUBLAYER_PARENT) {
                const sublayer = tryToConvertFeatureLayerToSublayer(selectedLayer);
                if (sublayer) {
                    sublayerHandle = sublayer.watch('definitionExpression', (newValue) => {
                        setDefinitionExpression(newValue);
                    });
                }
            }

            setDefinitionExpression(selectedLayer.definitionExpression);

            return () => {
                handle.remove();
                sublayerHandle?.remove();
                setFilterUpdated(false);
                setSelectedFeatures(null);
                setSQLText('');
                setParseTree(null);
            };
        } else {
            setDefinitionExpression('');
        }
    }, [selectedLayer]);

    /**
     * Sets the SQL text in the text view when a layer's definition expression changes
     */
    useEffect(() => {
        if (selectedLayer) {
            if (definitionExpression) {
                sql.parseWhereClause(definitionExpression, selectedLayer.fieldsIndex)
                    .then((whereClause) => {
                        if (whereClause.isStandardized) {
                            setParseTree(null);
                            setParseTree(whereClause.parseTree);
                            // @ts-ignore
                            if (filterUpdated) {
                                setFilterUpdated(false);
                                selectedLayer.definitionExpression = definitionExpression;
                            }
                        }
                    })
                    .catch((error) => LogHelper.log(error.message));
            } else {
                setParseTree(null);
                if (filterUpdated) {
                    setFilterUpdated(false);
                    selectedLayer.definitionExpression = '';
                }
            }
        }
    }, [definitionExpression]);

    /**
     * Validates the SQL text when it changes.
     */
    useEffect(() => {
        if (selectedLayer) {
            setFilterUpdated(true);
            if (sqlText && filterUpdated) {
                sql.parseWhereClause(sqlText, selectedLayer.fieldsIndex)
                    .then((whereClause) => {
                        setIsValidSQL(whereClause && whereClause.isStandardized);
                    })
                    .catch((_) => {
                        setIsValidSQL(false);
                    });
            } else {
                setIsValidSQL(true);
            }
        }
    }, [sqlText]);

    const handleApplyFilter = useCallback((): void => {
        if (selectedLayer) {
            // @ts-ignore
            selectedLayer.definitionExpression = sqlText;
            enqueueSnackbar("The Layer's definition expression has been updated.", { variant: 'success' });
        }
    }, [selectedLayer, sqlText]);

    const handleResetFilter = useCallback((): void => {
        if (selectedLayer) {
            if (selectedLayer.definitionExpression) {
                if (selectedLayer.definitionExpression !== sqlText) {
                    setFilterUpdated(false);
                    sql.parseWhereClause(selectedLayer.definitionExpression, selectedLayer.fieldsIndex)
                        .then((whereClause) => {
                            setParseTree(null);
                            setParseTree({ ...whereClause.parseTree });
                        })
                        .catch((e) => {
                            LogHelper.log(e.message, true);
                        });
                }
            } else {
                setFilterUpdated(false);
                setParseTree(null);
            }
        }
    }, [selectedLayer, filterUpdated, sqlText]);

    const handleSelectFilter = useCallback((): void => {
        if (selectedLayer) {
            const view = activeView === 'MAP' ? getMapView() : getSceneView();
            if (view) {
                selectedLayer
                    .queryObjectIds({ where: sqlText, timeExtent: view.timeExtent })
                    .then((value) => {
                        setSelectedFeatures(value ?? []);
                        const view = activeView === 'MAP' ? getMapView() : getSceneView();
                        if (view && selectedLayer) {
                            setSelectionData(view, selectedLayer, value ?? [], SelectionMode.NewSelectionSet);
                        }
                    })
                    .catch((error) => {
                        LogHelper.log(error.message, true);
                    });
            }
        }
    }, [selectedLayer, filterUpdated, sqlText, activeView]);

    /**
     * Removes the filter
     */
    const handleClearFilter = useCallback((): void => {
        if (selectedLayer) {
            // @ts-ignore
            setParseTree(null);
        }
    }, [selectedLayer]);

    /**
     * Replaces a node in the parse tree
     */
    const replaceNodeInParseTree = useCallback(
        (parseTree: SQLNode, targetNode: SQLNode, newTargetNode: SQLNode): SQLNode => {
            if (parseTree) {
                if (parseTree === targetNode) {
                    return newTargetNode;
                }
                if (
                    parseTree.type === 'binary-expression' &&
                    (parseTree.operator === 'AND' || parseTree.operator === 'OR')
                ) {
                    // @ts-ignore
                    parseTree.left = replaceNodeInParseTree(parseTree.left, targetNode, newTargetNode);
                    // @ts-ignore
                    parseTree.right = replaceNodeInParseTree(parseTree.right, targetNode, newTargetNode);
                }
            }

            return parseTree;
        },
        []
    );

    type CorrectedBinaryNode = Partial<BinaryNode> & { paren: boolean };

    /**
     * Removes a node from the parse tree by recursively iterating through the tree until it finds the target node,
     * and then returning the parent node. If the node to be deleted is a binary node, it ensures that the
     * tree is still valid by moving the appropriate element to the parent's binary node.
     */
    const removeNodeFromParseTree = useCallback((parseTree?: SQLNode, targetNode?: SQLNode): SQLNode | undefined => {
        if (parseTree) {
            if (!targetNode || parseTree === targetNode) {
                return undefined;
            }
            const rootNode = parseTree as CorrectedBinaryNode;
            if (rootNode.type === 'binary-expression' && (rootNode.operator === 'AND' || rootNode.operator === 'OR')) {
                const rightNode = rootNode.right as CorrectedBinaryNode;
                const leftNode = rootNode.left as CorrectedBinaryNode;

                // Preserve the grouping flag when removing
                if (leftNode === targetNode) {
                    if (rightNode.type === 'binary-expression') {
                        if (rightNode.paren) {
                            rootNode.paren = rightNode.paren;
                        } else {
                            rightNode.paren = rootNode.paren;
                        }
                    }
                    return removeNodeFromParseTree(rootNode.right, targetNode);
                } else if (rightNode === targetNode) {
                    if (leftNode.type === 'binary-expression') {
                        if (leftNode.paren) {
                            rootNode.paren = leftNode.paren;
                        } else {
                            leftNode.paren = rootNode.paren;
                        }
                    }
                    return removeNodeFromParseTree(rootNode.left, targetNode);
                }

                rootNode.left = removeNodeFromParseTree(rootNode.left, targetNode);
                rootNode.right = removeNodeFromParseTree(rootNode.right, targetNode);
            }
        }

        return parseTree;
    }, []);

    /**
     * Adds a filter to the Parse Tree
     */
    const handleAddFilter = useCallback((): void => {
        if (selectedLayer) {
            setFilterUpdated(true);
            const sqlClause = `${selectedLayer.objectIdField} = 0`;
            const sqlWhereClause = sqlText ? `${sqlText} AND ${sqlClause}` : sqlClause;
            sql.parseWhereClause(sqlWhereClause, selectedLayer.fieldsIndex)
                .then((whereClause) => {
                    if (whereClause.isStandardized) {
                        setParseTree(whereClause.parseTree);
                    }
                })
                .catch((error) => {
                    LogHelper.log(error.message, true);
                });
        }
    }, [selectedLayer, sqlText]);

    const handleRemoveNode = useCallback(
        (node: SQLNode) => {
            // @ts-ignore
            setParseTree((parseTree) => {
                if (!parseTree) return null;
                return { ...removeNodeFromParseTree(parseTree, node) };
            });
        },
        [removeNodeFromParseTree]
    );

    const handleAddNode = (root: SQLNode, child: SQLNode, operator: 'AND' | 'OR') => {
        if (selectedLayer) {
            // Make sure new node isn't a group
            // @ts-ignore
            child.paren = false;
            const childSql = getWhereClause(child);
            const sqlClause = `${selectedLayer.objectIdField} = 0`;
            const sqlWhereClause = childSql ? `(${childSql} ${operator} ${sqlClause})` : sqlClause;

            sql.parseWhereClause(sqlWhereClause, selectedLayer.fieldsIndex)
                .then((whereClause) => {
                    if (whereClause.isStandardized) {
                        const newTree = whereClause.parseTree as SQLNode;
                        if (root) {
                            if (root === child) {
                                setParseTree(newTree);
                            } else {
                                replaceNodeInParseTree(root, child, newTree);
                            }
                            setFilterUpdated(true);
                            setUpdateParseTree([]);
                        }
                    }
                })
                .catch((error) => {
                    LogHelper.log(error.message, true);
                });
        }
    };

    const handleGroupNodes = (node1: SQLNode, node2: SQLNode) => {
        const newTree = {
            type: 'binary-expression',
            operator: 'AND',
            left: node1,
            right: node2,
            paren: true,
        } as BinaryNode;
        setParseTree(newTree);
    };

    /**
     * Perform a debounced update
     */
    const handleUpdateParseTree = () => {
        setUpdateParseTree([]);
    };

    /**
     * Renders the parse Tree DOM
     */
    const parseTreeElement = useMemo(() => {
        if (selectedLayer && parseTree) {
            switch (parseTree.type) {
                case 'binary-expression':
                    if (parseTree.right?.type === 'interval') {
                        return (
                            <FilterTimeExpression
                                node={parseTree as BinaryNode}
                                handleNodeUpdated={handleUpdateParseTree}
                            />
                        );
                    } else {
                        return (
                            <FilterBinaryOperator
                                node={parseTree as BinaryNode}
                                layer={selectedLayer}
                                handleAddNode={handleAddNode}
                                handleNodeUpdated={handleUpdateParseTree}
                                handleGroupNodes={handleGroupNodes}
                                handleRemoveNode={handleRemoveNode}
                                parent={parseTree}
                            />
                        );
                    }
                default:
                    return <></>;
            }
        }

        return <></>;
    }, [parseTree, selectedLayer]);

    return (
        <WidgetContainer>
            <WidgetHeader position='static'>
                <InputGroup>
                    <StyledInlineToggleButton
                        selected={isSQLView}
                        title='SQL Filter View'
                        onChange={() => {
                            setIsSQLView(!isSQLView);
                        }}
                        onContextMenu={(event: MouseEvent) => {
                            event.preventDefault();
                            setIsDebugView(!isDebugView);
                        }}
                    >
                        <ScriptIcon size={16} />
                    </StyledInlineToggleButton>
                    <LayerSelect
                        map={map}
                        required={false}
                        title={'Filter Layer'}
                        selectedLayer={selectedLayer}
                        onChange={(layer) => {
                            if (layer) {
                                layer
                                    .load()
                                    .then((lyr) => setSelectedLayer(lyr))
                                    .catch((result) => {
                                        LogHelper.log(result, true);
                                        setSelectedLayer(undefined);
                                    });
                            } else {
                                setSelectedLayer(undefined);
                            }
                        }}
                        layerTypeFilter={(lyr): boolean => lyr && supportedTypes.includes(lyr.type)}
                        itemIconType={'has-filter'}
                        includeSublayersAsFeatureLayers={true}
                    />
                    <ActionButton
                        title='Add Filter'
                        onClick={handleAddFilter}
                        disabled={!selectedLayer || !selectedLayer.fields || selectedLayer.fields.length == 0}
                        variant='outlined'
                        type='button'
                        startIcon={<FilterIcon size={16} />}
                    >
                        Add
                    </ActionButton>
                </InputGroup>
            </WidgetHeader>

            {isSQLView && (
                <TextField
                    variant={'outlined'}
                    placeholder={
                        'There is no filter currently applied. You can manually add a filter expression in this section.'
                    }
                    disabled={!isSQLView}
                    fullWidth
                    multiline
                    maxRows={4}
                    minRows={4}
                    className={classes.input}
                    value={sqlText}
                    onChange={(event) => setSQLText(event.target.value)}
                />
            )}

            <WidgetContent elevation={0}>
                {selectedLayer &&
                    (!filterUpdated && !definitionExpression ? (
                        <Alert variant={'outlined'} color={'info'}>
                            There is no filter on this layer.
                        </Alert>
                    ) : error ? (
                        <Alert variant={'outlined'} title={'Error'}>
                            There was an error loading this layer.
                        </Alert>
                    ) : (
                        parseTreeElement
                    ))}
            </WidgetContent>

            {isDebugView && (
                <TextField
                    variant={'outlined'}
                    fullWidth
                    InputProps={{
                        readOnly: true,
                    }}
                    multiline
                    helperText={'Debug View - Right click on SQL View button to remove'}
                    minRows={15}
                    maxRows={15}
                    value={parseTree ? JSON.stringify(parseTree, null, 2) : ''}
                />
            )}

            {selectionMessage && (
                <Alert variant={'outlined'} color={'success'} onClose={() => setSelectionMessage('')}>
                    {selectionMessage}
                </Alert>
            )}

            <WidgetActions elevation={0}>
                {filterUpdated && (
                    <ActionButton
                        variant='outlined'
                        type='button'
                        title='Reset to Layer Filter'
                        disabled={!filterUpdated || error || !selectedLayer}
                        onClick={handleResetFilter}
                        startIcon={<ResetIcon size={16} />}
                    >
                        Reset
                    </ActionButton>
                )}
                {parseTree && (
                    <ActionButton
                        variant='outlined'
                        type='button'
                        title='Clear Filters'
                        disabled={error || !selectedLayer}
                        onClick={handleClearFilter}
                        startIcon={<EraseIcon size={16} />}
                    >
                        Clear
                    </ActionButton>
                )}

                <ActionButton
                    variant='outlined'
                    type='button'
                    title='Select Features by Filter'
                    disabled={!isValidSQL || error || !selectedLayer}
                    onClick={handleSelectFilter}
                    startIcon={<SelectionFilterIcon size={16} />}
                >
                    Select
                </ActionButton>

                <ActionButton
                    variant='contained'
                    color='secondary'
                    type='button'
                    title='Apply Filter to Layer'
                    disabled={!isValidSQL || !filterUpdated || error || !selectedLayer}
                    onClick={handleApplyFilter}
                    startIcon={<LayerFilterIcon size={16} />}
                >
                    Apply
                </ActionButton>
            </WidgetActions>
        </WidgetContainer>
    );
};

export default LayerFilter;
