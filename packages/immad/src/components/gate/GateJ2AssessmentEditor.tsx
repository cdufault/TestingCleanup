import React, { ChangeEvent, useEffect, useState } from 'react';
import { ActionButton, FieldGroup, InlineSelect, InputField, InputGroup, WidgetActions } from '../common';
import Geometry from '@arcgis/core/geometry/Geometry';

import { Box, IconButton, InputAdornment, MenuItem, Typography } from '@mui/material';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { ConfigHelper } from '../../helpers/configHelper';
import { useSnackbar } from 'notistack';
import { addJ2AssessmentFeature, textDateVal } from '@stratcom/lib-functions';
import { IFtrAttributeValueObj } from '../missionLog/MissionLogSlice';
import {
    StyledFullHeightTableDiv,
    StyledBodyHeadDiv,
    StyledBox,
    StyledFilterOptions,
    StyledWidgetHeaderText,
    StyledRefreshIconSpinning,
} from './styles';
import { Table, TableBody, TableHead, TableRow } from '@mui/material';
import TableCell from '@mui/material/TableCell';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';

import RichTextEditor from './RichTextEditor';
import ICODWidget from '../widgets/ICODDateWidget/ICODWidget';
import SortAscendingArrowIcon from 'calcite-ui-icons-react/SortAscendingArrowIcon';
import SortDescendingArrowIcon from 'calcite-ui-icons-react/SortDescendingArrowIcon';
import XIcon from 'calcite-ui-icons-react/XIcon';
import MagnifyingGlassIcon from 'calcite-ui-icons-react/MagnifyingGlassIcon';
import { StyledButtonRefreshIcon, StyledRefreshIcon } from './styles';

/**input props */
interface GateJ2AssessmentEditorProps {
    /**most recently updated comment text */
    j2AssessmentComments: textDateVal | undefined;
    /**update UI when this data has been updated and submitted */
    setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
    /**unique identifier to map this data to */
    regionGuid: string;
    /**name of the region */
    regionName: string;
    /**indicates if this mission is an exercise */
    missionIsExercise: boolean;
}

/**
 * sort types
 */
export enum SortType {
    'CREATED_DATE',
    'LAST_EDITED_DATE',
    'ICOD',
    'CREATED_USER',
}

/**
 * sort direction, ascending or descending
 */
export type SortDirection = 'ASC' | 'DESC';

/**UI for editing GATE J2 Assessment text */
function GateJ2AssessmentEditor(props: GateJ2AssessmentEditorProps): JSX.Element {
    const { j2AssessmentComments, setIsDirty, regionGuid, regionName, missionIsExercise } = props;

    const appConfig = ConfigHelper.getAppConfig();
    const [j2Assessment, setJ2Assessment] = useState<string>('');
    const { enqueueSnackbar } = useSnackbar();
    const j2AssessmentLabel = appConfig.gate.j2Assessment;
    const [icodDate, setICODDate] = useState(j2AssessmentComments?.dateVal);
    const [savedIcodDate, setSavedIcodDate] = useState<Date | undefined>(
        j2AssessmentComments?.dateVal ? new Date(j2AssessmentComments?.dateVal) : undefined
    );
    const [j2DialogValue, setJ2DialogValue] = useState<string>('');
    const [j2Open, setJ2Open] = useState<boolean>(false);
    const fieldsList = appConfig.gate.j2SummaryFields;
    const [featuresList, setFeaturesList] = useState<IFtrAttributeValueObj[]>([]);
    const [sortType, setSortType] = useState<SortType>(SortType.CREATED_DATE);
    const [sortDirection, setSortDirection] = useState<SortDirection>('DESC');
    const [searchValue, setSearchValue] = useState<string>('');
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    useEffect(() => {
        // requery j2 assessment features on direction sort and sort type
        //pause a quarter of a second to ensure user is done typing in search bar
        const timeoutId = setTimeout(() => {
            queryj2Assessments(sortType, sortDirection, searchValue);
        }, 250);
        return () => clearTimeout(timeoutId);
    }, [sortType, sortDirection, searchValue]);

    useEffect(() => {
        if (j2AssessmentComments?.textVal) {
            setJ2Assessment(j2AssessmentComments.textVal);
        }
        if (j2AssessmentComments?.dateVal) {
            setICODDate(new Date(j2AssessmentComments?.dateVal));
            setSavedIcodDate(new Date(j2AssessmentComments?.dateVal));
        }
    }, [j2AssessmentComments?.textVal, j2AssessmentComments?.dateVal]);

    const handleSortChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSortType(parseInt(event.target.value) as SortType);
    };

    const handleSortDirectionChange = () => {
        setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    };

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value);
    };

    const handleClearSearch = () => {
        setSearchValue('');
    };

    /**Handle save button click */
    async function saveButtonClickHandler() {
        await addJ2Assessment();
        await queryj2Assessments(sortType, sortDirection, searchValue);
    }

    /**
     * Update the J2 Assessment ftr data
     */
    async function addJ2Assessment() {
        setIsDirty(true);
        const j2SummaryFLayer = new FeatureLayer({
            portalItem: {
                id: missionIsExercise
                    ? appConfig.gate.exercise.exJ2SummaryFClassGuid
                    : appConfig.gate.j2SummaryFClassGuid,
            },
        });
        j2SummaryFLayer
            .load()
            .then(async () => {
                const success = await addJ2AssessmentFeature(
                    {
                        region_guid: regionGuid,
                        j2_summary: j2Assessment,
                        region_name: regionName,
                        icod: icodDate,
                    },
                    j2SummaryFLayer
                );
                const message = success ? `Successfully updated the ${j2AssessmentLabel}.` : 'Error updating data.';
                enqueueSnackbar(message, { variant: success ? 'info' : 'error' });
            })
            .catch((error) => {
                console.error(
                    `Error loading ${j2AssessmentLabel} layer: ${appConfig.gate.j2SummaryFClassGuid}`,
                    'ERROR',
                    error
                );
            });
    }

    /**
     * Query the J2 Assessment feature table to return rows for the selected mission of the fields specified in the config.
     * @param sortType field to sort on from j2 assessment table
     * @param sortDirection sort j2 assessment features ascending or descending
     * @param searchValue typed string in search bar to filter j2 assessment values
     */
    async function queryj2Assessments(sortType: SortType, sortDirection: SortDirection, searchValue: string) {
        const j2SummaryFLayer = new FeatureLayer({
            portalItem: {
                id: missionIsExercise
                    ? appConfig.gate.exercise.exJ2SummaryFClassGuid
                    : appConfig.gate.j2SummaryFClassGuid,
            },
        });
        let j2Query;
        const features: IFtrAttributeValueObj[] = [];
        try {
            const textStr = searchValue ? `%${searchValue}%` : '';
            j2Query = j2SummaryFLayer.createQuery();
            j2Query.outFields = fieldsList;
            j2Query.returnGeometry = false;
            if (searchValue !== '') {
                j2Query.where = `region_guid = '${regionGuid}' AND j2_summary LIKE '${textStr}'`;
            } else {
                j2Query.where = `region_guid = '${regionGuid}'`;
            }
            j2Query.orderByFields = ['created_date DESC'];
            const result = await j2SummaryFLayer.queryFeatures(j2Query);
            if (result && result.features.length > 0) {
                result.features.map((feature) => {
                    const fields = j2SummaryFLayer.fields;
                    const rowObject: IFtrAttributeValueObj = {};
                    // store result.features.attributes in array of objects
                    fields.forEach((field) => {
                        if (fieldsList.includes(field.name)) {
                            const searchKey = field.name;
                            const key = field.name;
                            const value = feature.attributes[searchKey];
                            rowObject[key] = value;
                        }
                    });
                    features.push(rowObject);
                });
            }
            const sortedFeatures = sortAssessmentFeatures(features, sortType, sortDirection);
            setFeaturesList(sortedFeatures);
            setIsRefreshing(false);
        } catch (error) {
            console.error('Error querying J2 Assessments for selected region', error);
        }
    }

    /**
     * Return the plain text from the HTML string input.
     *
     */
    const parseHtml = (sourceHtml: string) => {
        const doc = new DOMParser().parseFromString(sourceHtml, 'text/html');
        return doc.body.textContent || '';
    };

    /**
     * Return the formatted date string from date field input, otherwise return the input field value.
     *
     */
    const formatDate = (fieldValue: string | number | Date | Geometry) => {
        if (fieldValue instanceof Date || typeof fieldValue === 'number') {
            const date = new Date(fieldValue);
            const dateText = date.toUTCString();
            return dateText;
        } else {
            return fieldValue;
        }
    };

    /**
     * Handle the calendar date change
     * @param newDate user selected date
     */
    const handleStartDateChange = (newDate: Date) => {
        setICODDate(newDate);
    };

    /**
     * Handle J2 Summary field value clicked.
     */
    const handleJ2SummaryClicked = (j2Value: string) => (event: React.MouseEvent) => {
        setJ2Open(true);
        setJ2DialogValue(j2Value);
    };

    /**
     * Handle J2 Summary dialog closed event.
     */
    const handleCloseSummaryDialog = () => {
        setJ2Open(false);
    };

    /**
     * When the refresh button is clicked, run the j2 assessment feature query and display a notice to the user
     */
    const handleRefreshButtonClick = () => {
        setIsRefreshing(true);
        queryj2Assessments(sortType, sortDirection, searchValue).then(() =>
            enqueueSnackbar('J2 summary refreshed', { variant: 'info' })
        );
    };

    /**
     * @param features list of assessment features returned from the j2 assessment feature table query
     * @param sortType sort type
     * @param sortDirection sort direction
     * @returns a sorted array of j2 assessment features
     */
    function sortAssessmentFeatures(
        features: IFtrAttributeValueObj[],
        sortType: SortType,
        sortDirection: SortDirection
    ): IFtrAttributeValueObj[] {
        let sortFunc: (a: IFtrAttributeValueObj, b: IFtrAttributeValueObj) => number = (a, b) =>
            a.created_date > b.created_date ? 1 : -1;

        switch (sortType) {
            case SortType.CREATED_DATE:
                if (sortDirection === 'ASC') {
                    sortFunc = (a, b) => (a.created_date > b.created_date ? 1 : -1);
                } else {
                    sortFunc = (a, b) => (a.created_date < b.created_date ? 1 : -1);
                }
                break;
            case SortType.LAST_EDITED_DATE:
                if (sortDirection === 'ASC') {
                    sortFunc = (a, b) => (a.last_edited_date > b.last_edited_date ? 1 : -1);
                } else {
                    sortFunc = (a, b) => (a.last_edited_date < b.last_edited_date ? 1 : -1);
                }
                break;
            case SortType.ICOD:
                if (sortDirection === 'ASC') {
                    sortFunc = (a, b) => (a.icod > b.icod ? 1 : -1);
                } else {
                    sortFunc = (a, b) => (a.icod < b.icod ? 1 : -1);
                }
                break;
            case SortType.CREATED_USER:
                if (sortDirection === 'ASC') {
                    sortFunc = (a, b) => (a.created_user.toUpperCase() > b.created_user.toUpperCase() ? 1 : -1);
                } else {
                    sortFunc = (a, b) => (a.created_user.toUpperCase() < b.created_user.toUpperCase() ? 1 : -1);
                }
                break;
        }

        return [...features].sort(sortFunc);
    }

    /** UI */
    return (
        <>
            <FieldGroup>
                <Typography>{`${j2AssessmentLabel}`}</Typography>
                <Box sx={{ minHeight: '100px', marginTop: '15px' }}>
                    <RichTextEditor
                        commentDataOnStartup={j2AssessmentComments?.textVal ?? ''}
                        setUpdatedCommentVal={setJ2Assessment}
                    />
                </Box>
            </FieldGroup>
            <ICODWidget
                onDateChange={handleStartDateChange}
                selectedDate={icodDate}
                required={true}
                savedDate={savedIcodDate}
            />
            <WidgetActions>
                <ActionButton
                    variant='contained'
                    color='secondary'
                    type='button'
                    title='Save Edits.'
                    disabled={!icodDate}
                    onClick={saveButtonClickHandler}
                >
                    Save Edits
                </ActionButton>
            </WidgetActions>
            <StyledFullHeightTableDiv className={'j2-assessment-history-container'}>
                <StyledBodyHeadDiv className={'j2-assessment-history-header-container'}>
                    <StyledWidgetHeaderText className={'j2-assessment-history-header-text'}>
                        J2 Regional Assessment History
                    </StyledWidgetHeaderText>
                    <Box flexGrow={1} className={'j2-assessment-history-search-bar-container'}>
                        <InputField
                            variant='outlined'
                            placeholder='Search summary'
                            fullWidth
                            size='small'
                            color='secondary'
                            value={searchValue}
                            autoComplete='off'
                            onChange={handleSearchChange}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position='end'>
                                        <IconButton onClick={handleClearSearch} disabled={searchValue.length === 0}>
                                            <XIcon size={16} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <MagnifyingGlassIcon size={16} />
                                    </InputAdornment>
                                ),
                            }}
                            className={'j2-assessment-history-search-bar'}
                        />
                    </Box>
                    <StyledFilterOptions className={'j2-assessment-history-filter-sort-options-container'}>
                        <InputGroup className={'j2-assessment-history-filter-sort-input-group'}>
                            <InlineSelect
                                variant='outlined'
                                color='secondary'
                                value={sortType}
                                onChange={handleSortChange}
                                className={'j2-assessment-history-filter-dropdown'}
                            >
                                <MenuItem
                                    value={SortType.CREATED_DATE}
                                    className={'j2-assessment-history-sort-dropdown-item'}
                                >
                                    Created Date
                                </MenuItem>
                                <MenuItem
                                    value={SortType.LAST_EDITED_DATE}
                                    className={'j2-assessment-history-sort-dropdown-item'}
                                >
                                    Last Edited Date
                                </MenuItem>
                                <MenuItem value={SortType.ICOD} className={'j2-assessment-history-sort-dropdown-item'}>
                                    ICOD
                                </MenuItem>
                                <MenuItem
                                    value={SortType.CREATED_USER}
                                    className={'j2-assessment-history-sort-dropdown-item'}
                                >
                                    Created User
                                </MenuItem>
                            </InlineSelect>

                            <IconButton
                                onClick={handleSortDirectionChange}
                                className={'j2-assessment-history-sort-button'}
                            >
                                {sortDirection === 'ASC' && <SortAscendingArrowIcon size={16} />}
                                {sortDirection !== 'ASC' && <SortDescendingArrowIcon size={16} />}
                            </IconButton>
                        </InputGroup>
                    </StyledFilterOptions>
                    <StyledButtonRefreshIcon
                        title='Refresh J2 Assessment Summary'
                        disableRipple
                        disableFocusRipple
                        onClick={handleRefreshButtonClick}
                    >
                        {isRefreshing ? <StyledRefreshIconSpinning size={16} /> : <StyledRefreshIcon size={16} />}
                    </StyledButtonRefreshIcon>
                </StyledBodyHeadDiv>
                <Table>
                    <TableHead>
                        <TableRow key={'tableHeaderRow'}>
                            {fieldsList.map((field) => (
                                <TableCell key={field}>{field}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {featuresList.map((row, index) => (
                            <TableRow key={index}>
                                {fieldsList.map((field) => (
                                    <TableCell key={field}>
                                        {field === 'j2_summary' ? (
                                            <Button
                                                variant='outlined'
                                                onClick={handleJ2SummaryClicked(row[field] as string)}
                                            >
                                                {parseHtml(row[field] as string)}
                                            </Button>
                                        ) : (
                                            formatDate(row[field])
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Dialog open={j2Open} onClose={handleCloseSummaryDialog}>
                    <StyledBox>
                        <RichTextEditor
                            commentDataOnStartup={j2DialogValue}
                            setUpdatedCommentVal={setJ2Assessment}
                            isReadOnly={true}
                        />
                    </StyledBox>
                </Dialog>
            </StyledFullHeightTableDiv>
        </>
    );
}
export default GateJ2AssessmentEditor;
