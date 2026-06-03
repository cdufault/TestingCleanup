import { ISummaryItem } from "@stratcom/lib-functions";
/**Shape of the props for collection or row cells */
interface TableRowCellsProps {
    /**cell data/values for a table row */
    cellValues: string[];
    /**given an array of rows in a table this is row number x */
    currentItemCount: number;
    /**total number of rows that will be processed */
    totalRowCount: number;
    colored: string;
}
/**Template JSX for displaying table row cells*/
export declare const TableRowCells: (props: TableRowCellsProps) => JSX.Element;
/**Shape of the props TableHeaderCells cells*/
interface TableHeaderCellsProps {
    /**array of header cells */
    headerCells: string[];
    colored: string;
}
/**Template JSX for displaying a number of cellins in a header table row*/
export declare const TableHeaderCells: (props: TableHeaderCellsProps) => JSX.Element;
/**Shape of the props TableHeaderCells cells*/
interface TableSummaryCellsProps {
    /**array of header cells */
    summaryCells: ISummaryItem[];
    /**label on the cell summary/totals row */
    summaryLabel?: string;
}
/**Template JSX for displaying a number of cellins in a header table row*/
export declare const TableSummaryHeaderCells: (props: TableSummaryCellsProps) => JSX.Element;
/**Template JSX for displaying a number of cellins in a header table row*/
export declare const TableSummaryValueCells: (props: TableSummaryCellsProps) => JSX.Element;
export {};
