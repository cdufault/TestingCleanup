import React, { useState, useEffect, useRef } from 'react';
import ListItemText from '@mui/material/ListItemText';
import Collection from '@arcgis/core/core/Collection';
import WMSSublayer = __esri.WMSSublayer;
import Checkbox from '@mui/material/Checkbox';
import TreeView from '@mui/lab/TreeView/TreeView';
import ChevronRightIcon from 'calcite-ui-icons-react/ChevronRightIcon';
import { TreeItem } from '@mui/lab';
import ChevronDownIcon from 'calcite-ui-icons-react/ChevronDownIcon';
import { OverflowDiv } from '../styles';

/**
 * Defines the input properties required by the FilterListItems component.
 */
interface WmsLayerListItemsProps {
    onListChange(selectedLayers: Collection<string>): void;
    layerList: Collection<WMSSublayer>;
}

/**
 * A component containing a list of layers for the user to select.
 * @typedef {WmsLayerListItemsProps} props
 * @prop  {callback} onListChange(selectedLayers: Collection<string>): void
 * @prop {Collection<WMSSublayer>} layerList
 * @constructor
 */
export default function WmsLayerListItems(props: WmsLayerListItemsProps): JSX.Element {
    const layerList = props.layerList;
    const [selectedLayers, setSelectedLayers] = useState<__esri.Collection<string>>(new Collection());
    const [listItems, setListItems] = useState<Collection<JSX.Element | undefined>>();
    const layersAdded = useRef<string[]>([]);

    useEffect(() => {
        layersAdded.current = [];
        createListItems();
    }, [layerList, selectedLayers]);

    useEffect(() => {
        props.onListChange(selectedLayers);
    }, [selectedLayers]);

    /**
     * Handle the event for selecting/deselecting layers in the tree. This will select and deselect
     * parent and child nodes as well.
     * @param event - Mouse event for click.
     * @param item - Sublayer clicked on
     */
    const handleLayerClick = (event: React.MouseEvent<HTMLButtonElement>, item: __esri.WMSSublayer): void => {
        event.stopPropagation();
        if (selectedLayers.includes(item.title)) {
            const newSelectedLayers = selectedLayers.clone();
            newSelectedLayers.remove(item.title);
            newSelectedLayers.remove(item.parent.title);
            if (item.sublayers?.length > 0) {
                //If the layer has sublayers de-select the sub layers.
                for (const child of item.sublayers.toArray()) {
                    if (newSelectedLayers.includes(child.title)) {
                        newSelectedLayers.remove(child.title);
                    }
                }
            }
            setSelectedLayers(newSelectedLayers);
        } else {
            const newSelectedLayers = selectedLayers.clone();
            newSelectedLayers.add(item.title);
            if (item.sublayers?.length > 0) {
                //If the layer has sublayers de-select the sub layers.
                for (const child of item.sublayers.toArray()) {
                    if (!newSelectedLayers.includes(child.title)) {
                        newSelectedLayers.add(child.title);
                    }
                }
            }
            setSelectedLayers(newSelectedLayers);
        }
    };

    /**
     * Recursive call to create tree nodes and their children
     * @param item - sublayer used to create the tree node
     */
    const createListItem = (item: WMSSublayer) => {
        if (!layersAdded.current.includes(item.title)) {
            const label = (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                        color='primary'
                        checked={selectedLayers.includes(item.title)}
                        onClick={(event) => handleLayerClick(event, item)}
                        inputProps={{
                            'aria-label': 'select all users',
                        }}
                    />
                    <ListItemText primary={item.title} />
                </div>
            );
            layersAdded.current.push(item.title);
            const children = item.sublayers?.map((child) => {
                return createListItem(child);
            });
            return (
                <TreeItem nodeId={item.title} key={item.id} label={label}>
                    {children}
                </TreeItem>
            );
        }
    };

    /**
     * Function to create the first layer of tree nodes.
     */
    const createListItems = (): void => {
        const layerListItems = layerList.map((item) => {
            return createListItem(item);
        });
        setListItems(layerListItems);
    };

    return (
        <OverflowDiv>
            <TreeView
                defaultCollapseIcon={<ChevronDownIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                selected={selectedLayers.toArray()}
            >
                {listItems}
            </TreeView>
        </OverflowDiv>
    );
}
