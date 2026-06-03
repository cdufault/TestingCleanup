import React from "react";
import styled from "@emotion/styled";

import { TableCell, TableRow, Tooltip } from "@mui/material";
import { ISummaryItem } from "@stratcom/lib-functions";

/**Styled components */

const RowCell = styled(TableCell)`
  font-weight: 150;
  color: black;
  font-size: 0.95em;
  text-align: center;
  size: small;
`;
const RowFirstCell = styled(RowCell)`
  text-align: left;
  font-weight: 750;
`;

const LastRowCell = styled(RowCell)`
  font-weight: 600;
`;
const FirstCellLastRow = styled(TableCell)`
  font-weight: 600;
  text-align: left;
`;

const HeaderCell = styled(TableCell)`
  font-weight: bold;
  color: black;
  font-size: 1em;
  text-align: center;
`;
const FirstHeaderCell = styled(HeaderCell)`
  text-align: left;
`;

/**ui functions */
/**
 * Style a cell in a header row of a table based on it's position in the row
 * @param cellValue the value for the cell
 * @param index position of the cell in the row
 */
function headerItem(cellValue: string, index: number) {
  let keyVal = cellValue + "headerkey" + "_" + index;
  if (index === 0) {
    return (
      <FirstHeaderCell key={keyVal} sx={{ borderBottom: "none" }}>
        {""}
      </FirstHeaderCell>
    );
  }
  return (
    <HeaderCell key={keyVal} sx={{ borderBottom: "none" }}>
      {cellValue}
    </HeaderCell>
  );
}

/**
 * Style a cell in a header row of a table based on it's position in the row
 * @param cellValue the value for the cell
 * @param index position of the cell in the row
 */
function summaryValueItem(
  cellValue: number | string,
  index: number,
  tooltipText: string | undefined
) {
  let keyVal = cellValue + "headerkey" + "_" + index;
  let ttText = tooltipText ? tooltipText : "";
  return (
    <Tooltip title={ttText}>
      <HeaderCell key={keyVal} sx={{ paddingTop: "10px", fontWeight: "bold" }}>
        {cellValue}
      </HeaderCell>
    </Tooltip>
  );
}

function summaryHeaderItem(cellValue: string, index: number) {
  let keyVal = cellValue + "headerkey" + "_" + index;
  return (
    <HeaderCell key={keyVal} sx={{ paddingTop: "20px", fontWeight: "bold" }}>
      {cellValue}
    </HeaderCell>
  );
}

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
export const TableRowCells = (props: TableRowCellsProps): JSX.Element => {
  const { cellValues, currentItemCount, totalRowCount } = props;

  /**
   * Return a properly styled cell item based on the row's position in the rows array and the cell position
   * in that row
   * @param rowValue the data for the cell
   * @param itemIndex index of the cell in the cells for the row
   * @param currentItemCount index of the row in the table rows
   * @param totalRowCount total number of rows to be processed
   */
  function rowCellItem(
    cellValue: string | number,
    itemIndex: number,
    currentItemCount: number,
    totalRowCount: number
  ) {
    let keyVal =
      "rowcellkey" +
      "_" +
      currentItemCount +
      "_" +
      itemIndex +
      cellValue +
      "_" +
      Math.floor(Math.random() * 1000 - currentItemCount * itemIndex);
    if (itemIndex === 0) {
      return <RowFirstCell key={keyVal}>{cellValue}</RowFirstCell>;
    }
    return <RowCell key={keyVal}>{cellValue}</RowCell>;
  }

  const tableKey = "tablekey" + "_" + currentItemCount + "_" + totalRowCount;
  return (
    <TableRow key={tableKey} sx={{ bgcolor: props.colored }}>
      {cellValues.map((cellValue: string | number, idx: any) =>
        rowCellItem(cellValue, idx, currentItemCount, totalRowCount)
      )}
    </TableRow>
  );
};

/**UI components */

/**Shape of a single header cell */
interface headerCellItem {
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

/**Template JSX for displaying a number of cellins in a header table row*/
export const TableHeaderCells = (props: TableHeaderCellsProps): JSX.Element => {
  const { headerCells } = props;
  return (
    <TableRow sx={{ bgcolor: props.colored }}>
      {headerCells.map((headerCellItem, idx) =>
        headerItem(headerCellItem, idx)
      )}
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

/**Template JSX for displaying a number of cellins in a header table row*/
export const TableSummaryHeaderCells = (
  props: TableSummaryCellsProps
): JSX.Element => {
  const { summaryCells, summaryLabel } = props;
  return (
    <TableRow>
      <FirstHeaderCell key={"summary"} sx={{ paddingTop: "20px" }}>
        {""}
      </FirstHeaderCell>
      {summaryCells.map((summaryCell, idx) =>
        summaryHeaderItem(summaryCell.columnLabel, idx)
      )}
    </TableRow>
  );
};

/**Template JSX for displaying a number of cellins in a header table row*/
export const TableSummaryValueCells = (
  props: TableSummaryCellsProps
): JSX.Element => {
  const { summaryCells, summaryLabel } = props;
  const labelText = summaryCells.length < 1 ? "" : summaryLabel;
  return (
    <TableRow>
      <FirstHeaderCell key={"summary"} sx={{ paddingTop: "0px" }}>
        {labelText}
      </FirstHeaderCell>
      {summaryCells.map((summaryCell, idx) =>
        summaryValueItem(summaryCell.totalCount, idx, summaryCell.tooltipText)
      )}
    </TableRow>
  );
};
