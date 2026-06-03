interface GroupFilterExpression {
    condition1: DateFilterExpression | TextNumberFilterExpression;
    condition2: DateFilterExpression | TextNumberFilterExpression;
    filterType: string;
    operator: string;
}

interface DateFilterExpression {
    dateFrom: VarDate;
    dateTo: VarDate;
    filterType: string;
    type: string;
}

interface TextNumberFilterExpression {
    filter: string;
    filterTo?: string;
    filterType: string;
    type: string;
}

enum filterOperators {
    equals = '=',
    notEqual = '<>',
    lessThan = '<',
    lessThanOrEquals = '<=',
    greaterThan = '>',
    greaterThanOrEquals = '>=',
    notContains = 'NOT LIKE',
    contains = 'LIKE',
}

/***
 * @description returns an sql expression for a date filter
 */
function dateFilterToQueryString(fieldName: string, filterExpression: DateFilterExpression) {
    let filterString = '';
    switch (filterExpression.type) {
        case 'equals':
            const fromDate = new Date(filterExpression.dateFrom);
            const toDate = new Date(filterExpression.dateFrom);
            toDate.setDate(toDate.getDate() + 1);
            filterString = `(${fieldName} > '${fromDate.toLocaleDateString()}' AND ${fieldName} < '${toDate.toLocaleDateString()}')`;
            break;
        case 'notEqual':
        case 'greaterThan':
        case 'lessThan':
            filterString = `(${fieldName} ${filterOperators[filterExpression.type]} '${filterExpression.dateFrom}')`;
            break;
        case 'inRange':
            filterString = `(${fieldName} > '${filterExpression.dateFrom}' AND ${fieldName} < '${filterExpression.dateTo}')`;
            break;
    }
    return filterString;
}

/***
 * @description returns an sql expression for a number filter
 */
function numberFilterToQueryString(fieldName: string, filterExpression: TextNumberFilterExpression) {
    //this is a work around for the ag grid allowing text input in number filters
    //if the filter input is not a number return without updating filter
    if (filterExpression && isNaN(filterExpression.filter as any)) {
        return '';
    }
    let filterString = '';
    switch (filterExpression.type) {
        case 'equals':
        case 'notEqual':
        case 'greaterThan':
        case 'greaterThanOrEquals':
        case 'lessThan':
        case 'lessThanOrEquals':
            filterString = `(${fieldName} ${filterOperators[filterExpression.type]} ${filterExpression.filter})`;
            break;
        case 'inRange':
            filterString = `(${fieldName} > ${filterExpression.filter} AND ${fieldName} < ${filterExpression.filterTo})`;
            break;
    }
    return filterString;
}

/***
 * @description returns an sql expression for a text filter
 */
function textFilterToQueryString(fieldName: string, filterExpression: TextNumberFilterExpression) {
    let filterString = '';
    switch (filterExpression.type) {
        case 'equals':
        case 'notEqual':
            filterString = `(UPPER(${fieldName}) ${filterOperators[filterExpression.type]} UPPER('${filterExpression.filter}'))`;
            break;
        case 'startsWith':
            filterString = `(UPPER(${fieldName}) LIKE UPPER('${filterExpression.filter}%'))`;
            break;
        case 'endsWith':
            filterString = `(UPPER(${fieldName}) LIKE UPPER('%${filterExpression.filter}'))`;
            break;
        case 'contains':
            filterString = `(UPPER(${fieldName}) LIKE UPPER('%${filterExpression.filter}%'))`;
            break;
        case 'notContains':
            filterString = `(UPPER(${fieldName}) NOT LIKE UPPER('%${filterExpression.filter}%'))`;
            break;
    }
    return filterString;
}

/***
 * @description returns a sql query expression for a grouped set of conditions
 */
function groupFilterToQueryString(fieldName: string, filterExpression: GroupFilterExpression) {
    let filterStr1 = '';
    if (filterExpression.condition1.filterType === 'number') {
        filterStr1 = numberFilterToQueryString(fieldName, filterExpression.condition1 as TextNumberFilterExpression);
    } else if (filterExpression.condition1.filterType === 'date') {
        filterStr1 += dateFilterToQueryString(fieldName, filterExpression.condition1 as DateFilterExpression);
    } else {
        filterStr1 += textFilterToQueryString(fieldName, filterExpression.condition1 as TextNumberFilterExpression);
    }

    let filterStr2 = '';
    if (filterExpression.condition2.filterType === 'number') {
        filterStr2 = numberFilterToQueryString(fieldName, filterExpression.condition2 as TextNumberFilterExpression);
    } else if (filterExpression.condition1.filterType === 'date') {
        filterStr2 += dateFilterToQueryString(fieldName, filterExpression.condition2 as DateFilterExpression);
    } else {
        filterStr2 += textFilterToQueryString(fieldName, filterExpression.condition2 as TextNumberFilterExpression);
    }

    return `(${filterStr1} ${filterExpression.operator} ${filterStr2})`;
}

/***
 * @description Created a sql query string from an ag grid model
 */
export default function FilterModelToQueryString(filterModel: any): string {
    let filterString = '';
    if (Object.keys(filterModel).length) {
        for (const key in filterModel) {
            const item = filterModel[key];
            if (filterString) {
                filterString += ' AND ';
            }
            if (item.condition1) {
                filterString += groupFilterToQueryString(key, item as GroupFilterExpression);
            } else if (item.dateFrom) {
                filterString += dateFilterToQueryString(key, item as DateFilterExpression);
            } else {
                if (item.filterType === 'number') {
                    filterString += numberFilterToQueryString(key, item as TextNumberFilterExpression);
                } else {
                    filterString += textFilterToQueryString(key, item as TextNumberFilterExpression);
                }
            }
        }
    }
    return filterString;
}
