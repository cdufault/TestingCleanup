import React, { useEffect, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import FilterExpressionSet from './FilterExpressionSet';
import { AddFilterGroupDiv, FilterExpressionSelect } from '../styles';
import { FilterGroup, FilterJoinType } from '../resources';
import { FilterExpressionSet as FilterExpressionSetType } from '../resources';

/**
 * Defines the input properties for a FilterGroup component.
 */
interface FilterGroupProps {
    group: FilterGroup;
    removeExpressionSetFromGroup: (expressionSet: FilterExpressionSetType) => void;
}

const joinOptions = [
    <MenuItem key='AND' value='AND'>
        AND
    </MenuItem>,
    <MenuItem key='OR' value='OR'>
        OR
    </MenuItem>,
];

/**
 * The component that visualizes the collection of filter expressions.
 * @param props The properties for the component
 */
const FilterGroup = (props: FilterGroupProps): JSX.Element => {
    const [join, setJoin] = useState<FilterJoinType>(props.group.join);
    useEffect(() => {
        props.group.join = join;
    }, [join]);
    function removeFilterExpressionSet(expressionSet: FilterExpressionSetType): void {
        props.removeExpressionSetFromGroup(expressionSet);
    }
    return (
        <div>
            {props.group.expressionSets.length === 0 && (
                <AddFilterGroupDiv>
                    <h3>Add a filter</h3>
                    <div>Filters highlight features that matter to you.</div>
                    <div>Features not matching the query will be excluded from the feature set.</div>
                </AddFilterGroupDiv>
            )}
            {props.group.expressionSets.length > 0 &&
                props.group.expressionSets.map((expressionSet, index) => {
                    {
                        if (index > 0)
                            return (
                                <div key={'div' + expressionSet.id.toString()}>
                                    <FilterExpressionSelect
                                        variant='outlined'
                                        color='secondary'
                                        title='Select the filter operation.'
                                        onChange={(evt) => setJoin(evt.target.value as FilterJoinType)}
                                        value={join}
                                        key={index.toString()}
                                    >
                                        {joinOptions}
                                    </FilterExpressionSelect>
                                    <FilterExpressionSet
                                        key={expressionSet.id}
                                        expressionSet={expressionSet}
                                        removeExpressionSet={removeFilterExpressionSet}
                                    />
                                </div>
                            );
                    }
                    return (
                        <FilterExpressionSet
                            key={expressionSet.id}
                            expressionSet={expressionSet}
                            removeExpressionSet={removeFilterExpressionSet}
                        />
                    );
                })}
        </div>
    );
};

export default FilterGroup;
