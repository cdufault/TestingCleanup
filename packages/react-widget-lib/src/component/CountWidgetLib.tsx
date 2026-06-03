import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import {
  CircularProgress,
  Link,
  Table,
  TableBody,
  TableContainer,
  Typography,
  Box,
} from "@mui/material";

import {
  TableHeaderCells,
  TableSummaryHeaderCells,
  TableSummaryValueCells,
  TableRowCells,
} from "./CountWidgetTableCells";

import {
  findAppByKeywordAndType,
  retrieveRegionAppData,
  QueryForCountsLib,
  ICountsData,
  ISummaryItem,
  IQueryCountWidgetTableResults,
  RegionDisplayModeType,
} from "@stratcom/lib-functions";

const CenterBox = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

/**CountWidget props */
interface CountsWidgetProps {
  /** URL to the default portal */
  portalUrl: string;

  /** oauth application id from portal */
  oauthAppId: string;

  /** GATE Application typekeywords */
  gateTypeKeywords: string;

  /** Describes if the region display page will auto rotate in presentation mode or be a standard page */
  currentDisplayMode: RegionDisplayModeType;

  /** Alternating colors for the Count Widget categories. */
  categoryRowColors: string[];

  /** regionName should map to the name of the region and the regionName param in the JSON def that is
   * stored on the group/mission application object
   */
  regionName: string;

  /**pass a function to the widget that it can call to get the data */
  retrieveDataFunc?: () => Promise<IQueryCountWidgetTableResults>;

  /**pass the required data directly into the widget */
  activityCountsData?: IQueryCountWidgetTableResults;

  /**a function to callback when the counts are done calculating */
  countsCallbackFunc?: () => void;

  /**the application data object attached to the mission/group that holds the count configuration data */
  appData?: any;

  /**feature class field name holding the last time the row was updated */
  lastUpdatedFieldName?: string;

  /**if true run the queries one at a time waiting for each one to return before sending the next */
  executeCountQueriesSequentially?: boolean;

  cachedFeatureLayer?: any | undefined;
}

/**Counts widget initial template, will likely need props to support this widget as a shared library item */
export const CountWidgetLib = (props: CountsWidgetProps): JSX.Element => {
  const [rowData, setRowData] = useState<ICountsData[]>([]);
  const [totalCellData, setTotalCellData] = useState<ISummaryItem[]>();

  const [lastUpdatedDate, setLastUpdatedDate] = useState<string>("");
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  const [noDataFoundMessage, setNoDataFoundMessage] = useState<string>("");

  const portalUrl = props.portalUrl ? props.portalUrl : "";
  const oauthAppId = props.oauthAppId ? props.oauthAppId : "";
  const currentDisplayMode = props.currentDisplayMode
    ? props.currentDisplayMode
    : "Standard";
  const gateTypeKeywords = props.gateTypeKeywords ? props.gateTypeKeywords : "";

  const categoryRowColors = props.categoryRowColors
    ? props.categoryRowColors
    : ["light-gray", "gray"];

  const defaultRefreshIntervalIfNotDefined = 10;
  const [userDefinedTotals, setUserDefinedTotals] = useState<boolean>(false);
  const [summaryRowLabel, setSummaryRowLabel] = useState<string>("");
  const regionName = props.regionName ? props.regionName : "";
  const [btnRefreshText, setBtnRefreshText] = useState<string>("Refresh");

  useEffect(() => {
    let interval: NodeJS.Timer | undefined = undefined;
    if (autoRefreshInterval > 0 && currentDisplayMode === "Standard") {
      if (props.retrieveDataFunc) {
        interval = setInterval(retrieveData, autoRefreshInterval * 60 * 1000);
      } else {
        interval = setInterval(
          queryCountsOnInterval,
          autoRefreshInterval * 60 * 1000
        );
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefreshInterval]);

  useEffect(() => {
    //name the region after region name when creating mission
    if (regionName) {
      setAutoRefreshInterval(0);
      refreshCountsData();
    }
  }, [regionName]);

  function queryCountsOnInterval() {
    setBtnRefreshText("Refreshing...");
    queryCountsData();
  }
  /**
   * Rely on the helper method to query and format the data for the counts table
   */
  async function queryCountsData() {
    let regionAppData;
    const resultsFind: any = await findAppByKeywordAndType(
      portalUrl,
      gateTypeKeywords,
      oauthAppId
    );
    const selectedRegion = resultsFind?.results.find(
      (result: any) => result.title === regionName
    );
    regionAppData = await retrieveRegionAppData(
      selectedRegion.id,
      portalUrl,
      oauthAppId
    );

    if (regionAppData) {
      if (!regionAppData) {
        const message = `No app data found for: ${regionName} @ ${portalUrl}`;
        console.error(message);
        setNoDataFoundMessage("No data for this region. See log details.");
        return;
      }
      let refreshInterval = regionAppData.refreshIntervalInMinutes
        ? regionAppData.refreshIntervalInMinutes
        : defaultRefreshIntervalIfNotDefined;
      setAutoRefreshInterval(refreshInterval);

      await QueryForCountsLib(
        regionAppData,
        props.lastUpdatedFieldName,
        props.executeCountQueriesSequentially,
        props.cachedFeatureLayer
      )
        .then((data) => {
          data.summaryRowLabel
            ? setSummaryRowLabel(data.summaryRowLabel)
            : setSummaryRowLabel("Summary");
          setUserDefinedTotals(data.userDefinedTotals);
          data.totals && setTotalCellData(data.totals);
          setRowData(data.tableData);
          setLastUpdatedDate(data.lastUpdatedDate);
          setBtnRefreshText("Refresh");
          props.countsCallbackFunc && props.countsCallbackFunc();
        })
        .catch((error: any) => {
          console.error("Error retrieving counts data.", error);
          setNoDataFoundMessage(
            "Error retrieving counts data. See log for details."
          );
          setBtnRefreshText("Refresh");
          props.countsCallbackFunc && props.countsCallbackFunc();
        });
    } else {
      setNoDataFoundMessage("No count data was found.");
    }
  }

  /**
   * Method used when caller wants to use a custom method to
   * retrieve the data.
   */
  async function retrieveData() {
    if (props.retrieveDataFunc) {
      props
        .retrieveDataFunc()
        .then((data: IQueryCountWidgetTableResults) => {
          if (!data) {
            setNoDataFoundMessage("No count data was found.");
            return;
          }
          let refreshInterval =
            data.refreshIntervalInMinutes && data.refreshIntervalInMinutes > 0
              ? data.refreshIntervalInMinutes
              : defaultRefreshIntervalIfNotDefined;
          setAutoRefreshInterval(refreshInterval);
          renderData(data);
        })
        .catch((error: any) => {
          console.error("Error retrieving counts data.", error);
          setNoDataFoundMessage(
            "Error retrieving counts data. See log for details."
          );
          return;
        });
    }
  }

  /**
   * Render the table and the counts data
   * @param data object holding counts data
   */
  function renderData(data: any) {
    data.summaryRowLabel
      ? setSummaryRowLabel(data.summaryRowLabel)
      : setSummaryRowLabel("Summary");
    setUserDefinedTotals(data.userDefinedTotals);
    data.totals && setTotalCellData(data.totals);
    setRowData(data.tableData);
    setLastUpdatedDate(data.lastUpdatedDate);
  }

  /**Launch the call to query for counts and alter the refresh button while processing */
  function refreshCountsData() {
    if (regionName) {
      setNoDataFoundMessage("");
      if (props.retrieveDataFunc) {
        retrieveData();
      } else if (props.activityCountsData) {
        renderData(props.activityCountsData);
      } else {
        setBtnRefreshText("Refreshing...");
        queryCountsData();
      }
    }
  }

  /**Handle click event on the refresh link button */
  function handleRefreshBtnClick() {
    refreshCountsData();
  }

  /**alternating colors for row data or use the default */
  const colors = categoryRowColors ? categoryRowColors : ["gray", "lightgray"];

  let canDisplayWidget = true;
  if (portalUrl === "" || gateTypeKeywords === "" || regionName === "") {
    if (!props.retrieveDataFunc) {
      canDisplayWidget = false;
    }
    const message = `portalUrl: ${portalUrl} | gateTypeKeywords: ${gateTypeKeywords} | regionName: ${regionName}`;
    !canDisplayWidget && console.error(message);
  }

  return (
    <>
      {!canDisplayWidget ? (
        <Box
          sx={{
            height: "100%",
            color: "red",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            backgroundColor: "lightgray",
          }}
        >
          <CenterBox>
            <Typography>
              One or more inputs were not valid. See log for details.
            </Typography>
          </CenterBox>
        </Box>
      ) : (
        <Box
          sx={{
            height: "100%",
            color: "red",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            backgroundColor: "lightgray",
          }}
        >
          {totalCellData && rowData ? (
            <TableContainer
              sx={{ marginTop: "3px", marginLeft: "15px", marginRight: "15px" }}
            >
              <Table size="small">
                <TableBody>
                  {rowData &&
                    rowData.map((row, idx) => (
                      <>
                        <TableHeaderCells
                          headerCells={Object.keys(row)}
                          colored={colors ? colors[idx % 2] : ""}
                        />
                        <TableRowCells
                          cellValues={Object.values(row) as string[]}
                          currentItemCount={idx}
                          totalRowCount={rowData.length}
                          colored={colors ? colors[idx % 2] : ""}
                        />
                      </>
                    ))}
                  {totalCellData && userDefinedTotals && (
                    <TableSummaryHeaderCells
                      summaryCells={totalCellData}
                      summaryLabel={summaryRowLabel}
                    />
                  )}
                  {totalCellData && (
                    <TableSummaryValueCells
                      summaryCells={totalCellData}
                      summaryLabel={summaryRowLabel}
                    />
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            ""
          )}
          {rowData && rowData.length > 0 ? (
            <Box
              sx={{
                display: "flex",
                paddingTop: "10px",
                justifyContent: "space-around",
                width: "100%",
                color: "black",
              }}
            >
              <Box>
                <Typography variant="body2"> {lastUpdatedDate}</Typography>
              </Box>
              {!props.activityCountsData && (
                <Box>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={handleRefreshBtnClick}
                  >
                    {currentDisplayMode === "Presentation"
                      ? ""
                      : btnRefreshText}
                  </Link>
                </Box>
              )}
            </Box>
          ) : (
            ""
          )}
          {rowData.length < 1 && noDataFoundMessage === "" && (
            <CenterBox>
              <CircularProgress />
            </CenterBox>
          )}
          {noDataFoundMessage !== "" && (
            <CenterBox>
              <Typography>{noDataFoundMessage}</Typography>
            </CenterBox>
          )}
        </Box>
      )}
    </>
  );
};
