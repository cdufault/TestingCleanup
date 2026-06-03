/**
 * Describes the JSON for building an Activity Counts widget
 */
export interface ActivityCountsDataDef {
    regionName: string;
    summaryRowLabel: string;
    refreshIntervalInMinutes: number;
    /**if no summary total is provide this will be the default label otherwise it will be empty */
    defaultTotalColumnName: string;
    /**if no summary total is provide this will be the default value for the column otherwise it will be empty */
    defaultTotalColumnValue: string;
    categoryLabel?: string;
    rows: Row[];
    /**definitions for the summary row and how each column total is derived */
    defineColumnTotals?: ColumnTotalDef[];
}

/**
 * describes a row in the counts JSON
 */
export interface Row {
    /**source data for the row */
    ftrClassPortalItemId: string;
    hoverText: string;
    rowLabel: string;
    positionInTable: number;
    /**columns defined for the row */
    rowColumns: ColumnCountData[];
    lastUpdatedFieldName?: string;
}

/**
 * describes a column for a row, a row will usually have an array of these columns
 */
export interface ColumnCountData extends Record<string, any> {
    queryField: string;
    positionInTable: number;
    columnLabel: string;
    query: string;
}

/**
 * an element in the defineColumnTotal array
 */
export interface ColumnTotalDef {
    columnOutputPosition: number;
    columnLabel: string;
    columns: ColumnTotalItem[];
}

/**
 * describes an item/column in the ColumnTotalDef
 */
export interface ColumnTotalItem extends Record<string, any> {
    rowPosition: number;
    columnName: string;
}

/**
 * create a copy of an object and give all properties a new reference
 * @param origObj object to be copied
 * @returns reference to a new object
 */
export function deepCopyObjectGen<Type>(origObj: Type | Array<Type>): any {
    const objStringified = JSON.stringify(origObj);
    const copyObj = JSON.parse(objStringified);
    return copyObj;
}

/**
 * create a copy of an array and give it a new reference
 * @param origObj object to be copied
 * @returns reference to a new array
 */
export function deepCopyArray<Type>(origObj: Array<Type>): any {
    return deepCopyObjectGen(origObj);
}

/**
 * Add a new row to the JSON
 * @param rows existing rows
 * @returns a new reference to all the JSON row objects
 */
export const addRow = (rows: Row[], counter: number): Row[] => {
    let copiedArray = deepCopyArray(rows);
    const newItem = {
        ftrClassPortalItemId: '',
        hoverText: 'Tooltip text here',
        rowLabel: 'NewRow' + counter,
        positionInTable: rows.length + 1,
        rowColumns: [
            {
                positionInTable: 1,
                query: '1=1',
                queryField: '*',
                columnLabel: 'NewCol' + ++counter,
            },
        ],
    };

    copiedArray.push(newItem);
    return copiedArray;
};

/**
 * Mutate an array by setting the positionInTable property for each element to the aray index position of the element
 * @param copyArray array to work on
 * @returns a reference to the same array passed to the function
 */
function resetColumnPositions(copyArray: ColumnCountData[]): ColumnCountData[] {
    const updatedArray = copyArray.map((item: ColumnCountData, idx: number) => {
        item.positionInTable = idx + 1;
        return item;
    });
    return updatedArray;
}

/**
 * If a row is moved then all summary column items that point to that row must be updated to point to the new position of the row
 * @param summaryColumnsArray array of summary columns
 * @param itemToMoveArrayIndex index of the item in the rows array to be moved
 * @param direction the direction of the move 'up' or 'down'
 */
export function cascadeRowMoveOnSummaryColumns(
    summaryColumnsArray: ColumnTotalDef[],
    itemToMoveArrayIndex: number,
    direction: string
) {
    const workingPos = itemToMoveArrayIndex + 1; //one based attributes
    summaryColumnsArray.forEach((summary: ColumnTotalDef) => {
        summary.columns.forEach((column: ColumnTotalItem) => {
            if (column.rowPosition === workingPos) {
                if (direction === 'up') {
                    column.rowPosition -= 1;
                }
                if (direction === 'down') {
                    column.rowPosition += 1;
                }
            } else if (column.rowPosition === workingPos + 1) {
                if (direction === 'down') {
                    column.rowPosition -= 1;
                }
            } else if (column.rowPosition === workingPos - 1) {
                if (direction === 'up') {
                    column.rowPosition += 1;
                }
            }
        });
    });
}

/**
 * If a row is deleted then all summary column items that point point to that row are now invalid
 * and will be deleted
 * @param summaryColumnsArray array of summary count items
 * @param deletePos position in the rows array that will be deleted
 */
export function cascadeRowDeleteOnSummaryColumns(summaryColumnsArray: ColumnTotalDef[], deletePos: number) {
    summaryColumnsArray.forEach((summary: ColumnTotalDef) => {
        let itemsToKeep = summary.columns.filter((column: ColumnTotalItem) => column.rowPosition !== deletePos + 1);
        summary.columns = [...itemsToKeep];
    });

    summaryColumnsArray.forEach((summary: ColumnTotalDef) => {
        summary.columns.forEach((column: ColumnTotalItem) => {
            if (column.rowPosition > deletePos) {
                column.rowPosition -= 1;
            }
        });
    });
}

/**
 * Delete an item in an array and return a reference to a new array
 * @param indexToDelete position in the array to delets
 * @param rowsArray the array to work with
 * @returns a new reference to any array with the item deleted
 */
export function deleteItemInArrayGen<Type>(indexToDelete: number, rowsArray: Array<Type>): Array<Type> {
    const copyArray = deepCopyArray(rowsArray);
    copyArray.splice(indexToDelete, 1);

    return copyArray;
}

/**
 * Move an item in an array from one index to another
 * @param indexPos index of the item to be moved
 * @param direction move direction can be 'up', 'down', 'left',' right'
 * @param array working array
 * @returns reference to a new array with the item moved
 */
export function moveItemInArrayGen<Type>(
    indexPos: number,
    direction: string,
    array: Array<Type>
): { updatedArray: Array<Type>; newIndexPos: number } {
    let toPos = -1;
    if (direction === 'up' || direction === 'left') {
        toPos = indexPos - 1;
    } else {
        toPos = indexPos + 1;
    }
    if (toPos < 0 || toPos > array.length - 1) {
        return { updatedArray: array, newIndexPos: -1 }; //? -2
    }
    let copiedArray = deepCopyArray(array);
    const item = copiedArray.splice(indexPos, 1)[0];
    copiedArray.splice(toPos, 0, item);

    return { updatedArray: copiedArray, newIndexPos: toPos };
}

/**
 * Delete an item in a columns array and update each item's positionInRow attribute to the new index
 * @param pos position in the column to delete
 * @param rowColumns array of row column objects
 * @returns new reference to the array with the item deleted
 */
export const deleteColumn = (pos: number, rowColumns: ColumnCountData[]): ColumnCountData[] => {
    const copyArray = deepCopyArray(rowColumns);
    copyArray.splice(pos, 1);
    const updatedArray = resetColumnPositions(copyArray);
    return updatedArray;
};

/**
 * Add a new column to the columns array
 * @param rowColumns columns arry
 * @returns return a new reference to a columns array
 */
export const addColumn = (rowColumns: ColumnCountData[], counter: number): ColumnCountData[] => {
    const copyArray: ColumnCountData[] = deepCopyArray(rowColumns);
    copyArray.push({
        queryField: 'queryFieldName',
        positionInTable: copyArray.length,
        columnLabel: 'NewCol' + counter,
        query: '1=1',
    });
    const updatedArray = resetColumnPositions(copyArray);
    return updatedArray;
};

/**
 * Add a new item to the defineColumnTotals columns array
 * @param rowPosition position to add the new item - will default to 1 (1 based)
 * @param countDataColumns array to add the new item to
 * @param columnName the column label for the new item
 * @returns shallow copy with a new reference to a count data columns
 */
export const addNewCountDataColumn = (
    rowPosition: number = 1,
    countDataColumns: ColumnTotalItem[],
    columnName: string
): ColumnTotalItem[] => {
    const copyArray: ColumnTotalItem[] = [...countDataColumns];
    copyArray.push({
        columnName: columnName,
        rowPosition: rowPosition, //one based
    });
    return copyArray;
};

/**
 * Find the row with the greatest number of columns and return the column count for that row
 * @param data activity counts JSON
 * @returns max number of column
 */
export const calculateMaxColumnCount = (data: ActivityCountsDataDef): number => {
    let copyData = deepCopyObjectGen(data); //don't mutate passed in array
    let row = copyData.rows.sort((dataA: Row, dataB: Row) => dataB.rowColumns.length - dataA.rowColumns.length);
    return row && row.length > 0 ? row[0].rowColumns.length : 0;
};

/**
 * Get all the row names defined in the counts JSON
 * @param data parsed counts JSON
 * @returns array of all row names
 */
export const parseRowNames = (data: ActivityCountsDataDef): string[] => {
    const rowLabels = data.rows.map((row) => row.rowLabel);
    return rowLabels;
};

/**
 * Get all the column names defined in the counts JSON
 * @param data  parsed counts JSON
 * @returns array of all the column names
 */
export const parseColumnNames = (data: ActivityCountsDataDef): Map<string, string[]> => {
    const columnRowMap: Map<string, string[]> = new Map<string, string[]>();
    data.rows.forEach((row) => {
        const colNames = row.rowColumns.map((column) => column.columnLabel);
        columnRowMap.set(row.rowLabel, colNames);
    });

    return columnRowMap;
};
