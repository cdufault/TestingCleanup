import SQLNode = __esri.SQLNode;
import { NodeOperator } from '../components/FilterValue';

export class FilterOperation {
    //--Shared
    public static readonly IS = new FilterOperation('IS', 'is', '=', '{COLUMN} = {VALUE}');
    public static readonly IS_NOT = new FilterOperation('IS_NOT', 'is not', '<>', '{COLUMN} <> {VALUE}');
    public static readonly INCLUDES = new FilterOperation(
        'INCLUDES',
        'includes',
        'IN',
        '{COLUMN} IN ({VALUES})',
        'array'
    );
    public static readonly EXCLUDES = new FilterOperation(
        'EXCLUDES',
        'excludes',
        'NOT IN',
        '{COLUMN} NOT IN ({VALUES})',
        'array'
    );
    public static readonly IS_BETWEEN = new FilterOperation(
        'IS_BETWEEN',
        'is between',
        'BETWEEN',
        '{COLUMN} BETWEEN {VALUE1} AND {VALUE2}',
        2
    );
    public static readonly IS_NOT_BETWEEN = new FilterOperation(
        'IS_NOT_BETWEEN',
        'is not between',
        'NOT BETWEEN',
        '{COLUMN} NOT BETWEEN {VALUE1} AND {VALUE2}',
        2
    );
    public static readonly IS_BLANK = new FilterOperation('IS_BLANK', 'is blank', 'IS NULL', '{COLUMN} IS NULL');
    public static readonly IS_NOT_BLANK = new FilterOperation(
        'IS_NOT_BLANK',
        'is not blank',
        'IS NOT NULL',
        '{COLUMN} IS NOT NULL'
    );
    //--Strings
    public static readonly STARTS_WITH_str = new FilterOperation(
        'STARTS_WITH_str',
        'starts with',
        'LIKE',
        "{COLUMN} LIKE '{VALUE}%'"
    );
    public static readonly ENDS_WITH_str = new FilterOperation(
        'ENDS_WITH_str',
        'ends with',
        'LIKE',
        "{COLUMN} LIKE '%{VALUE}'"
    );
    public static readonly CONTAINS_str = new FilterOperation(
        'CONTAINS_str',
        'contains',
        'LIKE',
        "{COLUMN} LIKE '%{VALUE}%'"
    );
    public static readonly NOT_CONTAIN_str = new FilterOperation(
        'NOT_CONTAIN_str',
        'does not contain',
        'NOT LIKE',
        "{COLUMN} NOT LIKE '%{VALUE}%'"
    );
    //--Numbers
    public static readonly IS_AT_LEAST = new FilterOperation('IS_AT_LEAST', 'is at least', '>=', '{COLUMN} >= {VALUE}');
    public static readonly IS_AT_MOST = new FilterOperation('IS_AT_MOST', 'is at most', '<=', '{COLUMN} <= {VALUE}');
    public static readonly IS_LESS_THAN = new FilterOperation(
        'IS_LESS_THAN',
        'is less than',
        '<',
        '{COLUMN} < {VALUE}'
    );
    public static readonly IS_GREATER_THAN = new FilterOperation(
        'IS_GREATER_THAN',
        'is greater than',
        '>',
        '{COLUMN} > {VALUE}'
    );
    //--Dates
    public static readonly IS_ON = new FilterOperation('IS_ON', 'is on', '=', '{COLUMN} = {VALUE}');
    public static readonly IS_NOT_ON = new FilterOperation('IS_NOT_ON', 'is not on', '<>', '{COLUMN} <> {VALUE}');
    public static readonly IS_BEFORE = new FilterOperation('IS_BEFORE', 'is before', '<', '{COLUMN} < {VALUE}');
    public static readonly IS_AFTER = new FilterOperation('IS_AFTER', 'is after', '>', '{COLUMN} > {VALUE}');
    //public static readonly IN_THE_LAST = new FilterOperation("IN_THE_LAST", "in the last", "", "{COLUMN}  {VALUE}");
    //public static readonly NOT_IN_THE_LAST = new FilterOperation("NOT_IN_THE_LAST", "not in the last", "", "{COLUMN}  {VALUE}");

    private constructor(
        public readonly key: string,
        public readonly value: string,
        public readonly operation: string,
        public readonly format: string,
        public readonly numOfValues: 1 | 2 | 'array' = 1
    ) {}

    public toString(): string {
        return this.key;
    }
}

export type FilterOperationKeys = Exclude<keyof typeof FilterOperation, 'prototype'>;

export const FilterOperationKeys_String: FilterOperationKeys[] = [
    'IS',
    'IS_NOT',
    //"INCLUDES", "EXCLUDES",
    'STARTS_WITH_str',
    'ENDS_WITH_str',
    'CONTAINS_str',
    'NOT_CONTAIN_str',
    'IS_BLANK',
    'IS_NOT_BLANK',
];

export const FilterOperationKeys_Number: FilterOperationKeys[] = [
    'IS',
    'IS_NOT',
    //"INCLUDES", "EXCLUDES",
    'IS_AT_LEAST',
    'IS_AT_MOST',
    'IS_LESS_THAN',
    'IS_GREATER_THAN',
    'IS_BETWEEN',
    'IS_NOT_BETWEEN',
    'IS_BLANK',
    'IS_NOT_BLANK',
];

export const FilterOperationKeys_Date: FilterOperationKeys[] = [
    'IS_ON',
    'IS_NOT_ON',
    'IS_BEFORE',
    'IS_AFTER',
    //"IN_THE_LAST", "NOT_IN_THE_LAST",
    //"IS_BETWEEN", "IS_NOT_BETWEEN",
    'IS_BLANK',
    'IS_NOT_BLANK',
];

/**
 * Gets the where clause SQL from a SQL Node
 * @param node
 * @param operator
 */
export const getWhereClause = (node: SQLNode, operator?: NodeOperator): string => {
    if (node) {
        switch (node.type) {
            case 'case-expression':
                break;
            case 'expression-list': {
                // @ts-ignore ListNode contains value
                const nodeValue = node.value;
                if (operator === 'BETWEEN' || operator === 'NOTBETWEEN') {
                    return getWhereClause(nodeValue[0]) + ' AND ' + getWhereClause(nodeValue[1]);
                }
                return '(' + nodeValue.map((item: SQLNode) => getWhereClause(item)).join(',') + ')';
            }
            case 'unary-expression':
                break;
            case 'interval':
                return 'INTERVAL ' + getWhereClause(node.value) + `${node.op} ` + getWhereClause(node.qualifier);
            case 'interval-qualifier':
                break;
            case 'interval-period':
                return node.period.toUpperCase(); // hour, minute, day
            case 'null':
                return 'NULL';
            case 'boolean':
                return node.value ? 'TRUE' : 'FALSE';
            case 'string':
                return `'${node.value}'`;
            case 'number':
                return `${node.value}`;
            case 'date':
                return `DATE '${node.value}'`;
            case 'timestamp':
                return `TIMESTAMP '${node.value}'`;
            case 'column-reference':
                return node.column;
            case 'current-time':
                switch (node.mode) {
                    case 'timestamp':
                        return 'CURRENT_TIMESTAMP';
                    case 'date':
                        return 'CURRENT_DATE';
                    default:
                        throw new Error('Not supported: ' + node.mode);
                }
            case 'function':
                break;
            case 'when-clause':
                break;
            case 'binary-expression': {
                const sqlOperator =
                    node.operator === 'ISNOT'
                        ? 'IS NOT'
                        : node.operator === 'NOTBETWEEN'
                        ? 'NOT BETWEEN'
                        : node.operator;
                const expr = `${getWhereClause(node.left, node.operator)} ${sqlOperator} ${getWhereClause(
                    node.right,
                    node.operator
                )}`;
                // @ts-ignore JSAPI typing error
                return node.paren ? '(' + expr + ')' : expr;
            }
        }
    }
    return '';
};
