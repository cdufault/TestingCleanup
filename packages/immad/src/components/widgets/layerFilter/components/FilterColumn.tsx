/**
 * The component that represents a value of a filter expression.
 * @param props The properties for the component
 */
import React, { useEffect, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import BoolNode = __esri.BoolNode;
import StringNode = __esri.StringNode;
import DateNode = __esri.DateNode;
import NumberNode = __esri.NumberNode;
import ColumnNode = __esri.ColumnNode;
import SQLNode = __esri.SQLNode;
import { FilterableLayer } from '../LayerFilter';
import { ListItemIcon, ListItemText, Select } from '@mui/material';
import StringIcon from 'calcite-ui-icons-react/StringIcon';
import BlankIcon from 'calcite-ui-icons-react/BlankIcon';
import ClockIcon from 'calcite-ui-icons-react/ClockIcon';

export type FilterValueNode = BoolNode | StringNode | NumberNode | DateNode;

export interface FilterColumnProps {
    layer: FilterableLayer;
    node: ColumnNode;
    handleNodeUpdated: (node: SQLNode) => void;
}

export const FilterColumn = (props: FilterColumnProps): JSX.Element => {
    const { layer, node } = props;

    const fieldIndex = layer.fieldsIndex;

    const [value, setValue] = useState<string>(node.column);

    useEffect(() => {
        setValue(node.column);
    }, [node]);

    useEffect(() => {
        // @ts-ignore JSAPI Type error
        node.column = value;
        props.handleNodeUpdated(node);
    }, [value]);

    return <Select
            sx={{maxWidth:'30%'}}
            variant='outlined'
            color='secondary'
            value={value}
            fullWidth
            renderValue={value => <>{value}</>}
            onChange={(event) => {
                if (event.target.value) {
                    const field = fieldIndex.get(event.target.value);
                    if (field) {
                        setValue(field.name);
                    }
                }
            }}
        >
            {layer.fields
                .filter((field) => field.type !== 'geometry')
                .map((field) => {
                    return (
                        <MenuItem key={field.name} value={field.name}>
                            <ListItemIcon>
                                {
                                    field.type === 'string' ? <StringIcon/> :
                                        field.type === 'date' ? <ClockIcon/> :
                                            <BlankIcon />
                                }
                            </ListItemIcon>
                            <ListItemText>{field.name}</ListItemText>
                        </MenuItem>
                    );
                })}
        </Select>
};
