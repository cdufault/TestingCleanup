import React from 'react';
import { TableCell, TableRow, Tooltip } from '@mui/material';
import styled from '@emotion/styled';
import {ISummaryItem } from '@stratcom/lib-functions';

const HeaderCell = styled(TableCell)`
    font-weight: bold;
    color: black;
    font-size: 1em;
    text-align: center;
`;
const FirstHeaderCell = styled(HeaderCell)`
    text-align: left;
`;
/**Shape of a single header cell */
interface headerCell {
    /**Value for the cell */
    headerCellValue: string;
    /**position of the cell in the row */
    position?: number;
}
/**Shape of the props TableHeaderCells cells*/
interface TableHeaderCellsProps {
    /**array of header cells */
    headerCells: string[];
    colored: string;
}

/**
 * Style a cell in a header row of a table based on it's position in the row
 * @param cellValue the value for the cell
 * @param index position of the cell in the row
 */
function headerItem(cellValue: string, index: number) {
    let keyVal = cellValue + 'headerkey' + '_' + index;
    if (index === 0) {
        return (
            <FirstHeaderCell key={keyVal} sx={{ borderBottom: 'none' }}>
                {''}
            </FirstHeaderCell>
        );
    }
    return (
        <HeaderCell key={keyVal} sx={{ borderBottom: 'none' }}>
            {cellValue}
        </HeaderCell>
    );
}

/**Template JSX for displaying a number of cellins in a header table row*/
export const TableHeaderCells = (props: TableHeaderCellsProps): JSX.Element => {
    const { headerCells } = props;
    return (
        <TableRow sx={{ bgcolor: props.colored }}>
            {headerCells.map((headerCell, idx) => headerItem(headerCell, idx))}
        </TableRow>
    );
};

/**Shape of the props TableHeaderCells cells*/
interface TableSummaryCellsProps {
    /**array of header cells */
    summaryCells: ISummaryItem[];

    /**label on the cell summary/totals row */
    summaryLabel?: string;
}
/**
 * Style a cell in a header row of a table based on it's position in the row
 * @param cellValue the value for the cell
 * @param index position of the cell in the row
 */
function summaryValueItem(cellValue: number | string, index: number, tooltipText: string | undefined) {
    let keyVal = cellValue + 'headerkey' + '_' + index;
    let ttText = tooltipText ? tooltipText : '';
    return (
        <Tooltip title={ttText}>
            <HeaderCell key={keyVal} sx={{ paddingTop: '10px' }}>
                {cellValue}
            </HeaderCell>
        </Tooltip>
    );
}

function summaryHeaderItem(cellValue: string, index: number) {
    let keyVal = cellValue + 'headerkey' + '_' + index;
    return (
        <HeaderCell key={keyVal} sx={{ paddingTop: '20px' }}>
            {cellValue}
        </HeaderCell>
    );
}

/**Template JSX for displaying a number of cellins in a header table row*/
export const TableSummaryHeaderCells = (props: TableSummaryCellsProps): JSX.Element => {
    const { summaryCells, summaryLabel } = props;
    return (
        <TableRow>
            <FirstHeaderCell key={'summary'} sx={{ paddingTop: '20px' }}>
                {''}
            </FirstHeaderCell>
            {summaryCells.map((summaryCell, idx) => summaryHeaderItem(summaryCell.columnLabel, idx))}
        </TableRow>
    );
};

/**Template JSX for displaying a number of cellins in a header table row*/
export const TableSummaryValueCells = (props: TableSummaryCellsProps): JSX.Element => {
    const { summaryCells, summaryLabel } = props;
    const labelText = summaryCells.length < 1 ? '' : summaryLabel;
    return (
        <TableRow>
            <FirstHeaderCell key={'summary'} sx={{ paddingTop: '0px' }}>
                {labelText}
            </FirstHeaderCell>
            {summaryCells.map((summaryCell, idx) =>
                summaryValueItem(summaryCell.totalCount, idx, summaryCell.tooltipText)
            )}
        </TableRow>
    );
};
