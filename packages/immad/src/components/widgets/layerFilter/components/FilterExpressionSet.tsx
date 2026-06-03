import React from 'react';
import FilterExpression from './FilterExpression';
import { FilterExpressionSet } from '../resources';

/**
 * Defines the input properties for the FilterExpressionSet component.
 */
interface FilterExpressionSetProps {
    expressionSet: FilterExpressionSet;
    removeExpressionSet: (expressionSet: FilterExpressionSet) => void;
}

/**
 * The component that visualizes the a collection filter clauses.
 * @param props The properties for the component
 */
const FilterExpressionSet = (props: FilterExpressionSetProps): JSX.Element => {
    const { expressionSet, removeExpressionSet } = props;
    function removeFilterExpression(): void {
        removeExpressionSet(expressionSet);
    }

    return (
        <div>
            <div>
                {props.expressionSet.expressions.map((expression) => {
                    return (
                        <FilterExpression
                            key={expression.id}
                            expression={expression}
                            removeExpressionFunction={removeFilterExpression}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default FilterExpressionSet;
