// React imports
import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react';

// Component imports
import {
    InlineSelect,
    InputField,
    InputGroup,
    WidgetActions,
    WidgetContainer,
    WidgetContent,
    WidgetHeader,
} from '../../common';
import { Alert, Box, CircularProgress, Grid, IconButton, InputAdornment, MenuItem, Typography } from '@mui/material';
import Filter from './components/Filter';
import { StyledPagination } from './styles';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import MagnifyingGlassIcon from 'calcite-ui-icons-react/MagnifyingGlassIcon';
import XIcon from 'calcite-ui-icons-react/XIcon';
import SortAscendingArrowIcon from 'calcite-ui-icons-react/SortAscendingArrowIcon';
import SortDescendingArrowIcon from 'calcite-ui-icons-react/SortDescendingArrowIcon';
import PortalItemCard from './components/PortalItemCard';

import useResizer from '../../../helpers/useResizer';

// Helper imports
import {
    DataFeedItem,
    ExtentType,
    FilterGroups,
    PortalGroups,
    sortDataFeeds,
    SortDirection,
    SortType,
} from './resources';
import { loadDataFeeds } from './helpers/portalHelper';
import { getUserGroup } from '../../../helpers/userHelper';
import { ConfigHelper } from '../../../helpers/configHelper';

import * as promiseUtils from '@arcgis/core/core/promiseUtils.js';

// Context imports
import { AppContext } from '../../../contexts/App';
import { MapContext } from '../../../contexts/Map';
import { SaveLoadContext } from '../../../contexts/SaveLoad';
import Extent from '@arcgis/core/geometry/Extent';
import { getMissionExtentByTitle } from '../../../helpers/missionHelper';
import { MissionAction, MissionState } from '../../../contexts/missionStateReducer';
import ViewCardActionItems from '../../home/components/missionCreate/views/ViewCardActionItems';
import { useAppSelector } from '../../../hooks/hooks';
import { getPortalUserSession } from '@stratcom/lib-functions';
import { UserSession } from '@esri/arcgis-rest-auth';

/**
 * properties that can be used when extending this widget for uses other than loading data feeds.
 */
interface OtherFeedItemTypeProps {
    /**state of the reducer used to support the widget for map/scene selection in the create mission workflow */
    missionState?: MissionState;
    /**update the reducer using this function when supporting using the widget for map/scene selection in the create mission workflow */
    dispatch?: React.Dispatch<MissionAction> | undefined;
}

/**
 *  isSpatial               //if true enables filter by extent option
    showFilter              //show filter in header
    showSearch              //show search bar in header
    showSort                //show sort options/icon in header
    itemTypes               //portal types to return from portal
    tags                    //query using tags (OR)
    itemsPerPage            //used for paging
    cardActionsTemplate     //card actions component to embedded in the item card (ex. buttons)

    categories?:               //currently selected categories to use as a filter
    useDataPaging?:            //when set to true the widget will try to page thru all the records up to the maxRecourdCountWhenPaging
    siblingItemCounts?:        //the number of page items to show to the left and right of the current page 1 ....5 6 7  8   9 10 11... 15

    otherFeedItemTypes?:       //properties specifically to support map/scene selection in the create mission workflow
 */
interface portalItemListProps {
    isSpatial: boolean;
    showFilter: boolean;
    showSearch: boolean;
    showSort: boolean;
    itemTypes: string[];
    tags?: string[];
    itemsPerPage: number;
    cardActionsTemplate: JSX.Element | undefined;

    /**new properties added to support using the widget for scene/map selection in mission creation workflow */
    categories?: string;
    useDataPaging?: boolean;
    siblingItemCounts?: number;
    otherFeedItemTypes?: OtherFeedItemTypeProps;
    runFilterOnUserName?: boolean;
}

/**
 * Reusable component for displaying a list of portal items with filter, paging and search options built in
 * The card actions for the displayed item are set using a template, an example is included in ./examples
 * @param props
 */
function PortalItemList(props: portalItemListProps): JSX.Element {
    const {
        isSpatial,
        showFilter,
        showSearch,
        showSort,
        tags,
        itemsPerPage,
        cardActionsTemplate,
        useDataPaging,
        siblingItemCounts,
        categories,
        otherFeedItemTypes,
        runFilterOnUserName,
    } = props;
    const AppConfig = useAppSelector((state) => state.applicationSlice);
    /**when extending the widget use this object to set default values as needed */
    const { missionState, dispatch } = otherFeedItemTypes
        ? otherFeedItemTypes
        : {
              dispatch: undefined,
              missionState: {},
          };
    const [missionNameInStateReducer] = useState<string | undefined>(
        missionState && missionState.name ? missionState.name : undefined
    );
    const { portalUser, userRoles } = useContext(AppContext);
    const { activeView, getMapView, getSceneView } = useContext(MapContext);
    const { missionSelect } = useContext(SaveLoadContext);
    const [searchValue, setSearchValue] = useState('');
    const [feeds, setFeeds] = useState<DataFeedItem[]>([]);
    const [isLoadingFeeds, setIsLoadingFeeds] = useState(true);
    const [page, setPage] = useState(0);
    const [sortType, setSortType] = useState<SortType>(SortType.MODIFIED);
    const [sortDirection, setSortDirection] = useState<SortDirection>('DESC');
    const [portalGroups, setPortalGroups] = useState<PortalGroups>({
        admin: undefined,
        missionManager: undefined,
        analyst: undefined,
    });
    const [filterGroups, setFilterGroups] = useState<FilterGroups>({
        admin: userRoles.Administrator === false,
        missionManager: userRoles.MissionManager === false,
        analyst: userRoles.Analyst === false,
    });
    const [filterMyContent, setFilterMyContent] = useState(() => {
        return !!runFilterOnUserName;
    });

    const [filterMyOrganization, setFilterMyOrganization] = useState(false);
    const [filterCurrentMission, setFilterCurrentMission] = useState(false);
    const [filterExtent, setFilterExtent] = useState(false);
    const [hasMission, setHasMission] = useState(false);
    const [filterExtentType, setFilterExtentType] = useState<ExtentType>(ExtentType.MISSION);

    const controller = useRef<AbortController>();

    const paginationEl = useRef<HTMLDivElement>(null);
    const dataFeedsContent = useRef<HTMLDivElement>(null);
    const paginationSize = useResizer(paginationEl);

    const [filterByWebSceneOnlyTag, setFilterByWebSceneOnlyTag] = useState<boolean>(false);
    const [filterByWebMapOnlyTag, setFilterByWebMapOnlyTag] = useState<boolean>(false);
    const [nextStart, setNextStart] = useState<number>(-1);
    const [totalRecordCount, setTotalRecordCount] = useState<number>(0);
    const [siblingCount] = useState<number>(siblingItemCounts ? siblingItemCounts : 0);
    const [missionStateSceneId, setMissionStateSceneId] = useState<string>('');
    const { maxRecordCountWhenPaging } = ConfigHelper.getAppConfig().portalItemList;
    const [numberOfRecordsToUseWhenPaging] = useState<number>(
        maxRecordCountWhenPaging ? maxRecordCountWhenPaging : 100
    );
    const [itemTypes, setItemTypes] = useState(props.itemTypes);
    const [userSession, setUserSession] = useState<UserSession>();

    useEffect(() => {
        let mounted = true;
        const loadGroups = async () => {
            const groups = await portalUser.fetchGroups();

            const { admin, missionManager, analyst } = ConfigHelper.getAppConfig().roles;
            const adminGroup = getUserGroup(groups, admin.tag);
            const missionManagerGroup = getUserGroup(groups, missionManager.tag);
            const analystGroup = getUserGroup(groups, analyst.tag);
            mounted &&
                setPortalGroups({
                    admin: adminGroup ? adminGroup.id : undefined,
                    missionManager: missionManagerGroup ? missionManagerGroup.id : undefined,
                    analyst: analystGroup ? analystGroup.id : undefined,
                });
        };
        initializeUserSession();

        loadGroups();
        return function cleanup() {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (missionSelect && missionSelect !== 'appDefault') {
            setHasMission(true);
            setFilterExtentType(ExtentType.MISSION);
        } else {
            setHasMission(false);
            setFilterExtentType(ExtentType.VIEW);
        }
    }, [missionSelect]);

    useEffect(() => {
        if (portalGroups.admin || portalGroups.missionManager || portalGroups.analyst) {
            loadFeeds();
        }
    }, [
        portalGroups,
        filterGroups,
        filterMyContent,
        filterMyOrganization,
        missionSelect,
        filterCurrentMission,
        filterExtent,
        filterExtentType,
        filterByWebSceneOnlyTag,
        filterByWebMapOnlyTag,
    ]);

    useEffect(() => {
        //pause a quarter of a second to ensure user is done typing
        const timeoutId = setTimeout(() => {
            if (portalGroups.admin || portalGroups.missionManager || portalGroups.analyst) {
                loadFeeds();
            }
        }, 250);
        return () => clearTimeout(timeoutId);
    }, [searchValue]);

    useEffect(() => {
        const view = activeView === 'MAP' ? (getMapView() as MapView) : (getSceneView() as SceneView);
        if (filterExtent && filterExtentType === ExtentType.VIEW) {
            const handler = view.watch(['stationary'], () => {
                loadFeeds();
            });
            return () => {
                handler.remove();
            };
        }
    }, [filterExtent, filterExtentType]);

    useEffect(() => {
        if (feeds.length > 0) {
            setIsLoadingFeeds(false);
        }
    }, [feeds]);

    useEffect(() => {
        // requery data feeds on direction sort
        loadFeeds();
    }, [sortType, sortDirection, categories]);

    useEffect(() => {
        if (missionState?.mapItem) {
            setMissionStateSceneId(missionState.mapItem.id);
        } else {
            setMissionStateSceneId('');
        }
    }, [missionState?.mapItem]);

    useEffect(() => {
        const allowedTypes = ['Web Map', 'Web Scene'];

        // Only run this effect if initial itemTypes include either map or scene
        const shouldFilterApply = props.itemTypes.some((type) => allowedTypes.includes(type));

        if (!shouldFilterApply) return;

        if (filterByWebMapOnlyTag && !filterByWebSceneOnlyTag) {
            setItemTypes(['Web Map']);
        } else if (!filterByWebMapOnlyTag && filterByWebSceneOnlyTag) {
            setItemTypes(['Web Scene']);
        } else if (filterByWebMapOnlyTag && filterByWebSceneOnlyTag) {
            setItemTypes(['Web Map', 'Web Scene']);
        } else {
            const isOnlyMapScene = itemTypes.every((t) => allowedTypes.includes(t)) && itemTypes.length <= 2;
            if (isOnlyMapScene || itemTypes.length === 0) {
                setItemTypes(['Web Map', 'Web Scene']);
            }
        }
    }, [filterByWebMapOnlyTag, filterByWebSceneOnlyTag, props.itemTypes]);

    useEffect(() => {
        if (itemTypes.length > 0) {
            loadFeeds();
        }
    }, [itemTypes]);

    const initializeUserSession = async () => {
        setUserSession(await getPortalUserSession(AppConfig.portalUrl, AppConfig.oauthAppId));
    };

    const getFilterExtent = async () => {
        const view: MapView | SceneView =
            activeView === 'MAP' ? (getMapView() as MapView) : (getSceneView() as SceneView);
        let extent: Extent | undefined = undefined;

        //explicitly checking for undefined here because 0 is a valid value for the extent type enum
        if (filterExtentType != undefined) {
            if (missionSelect && filterExtentType.valueOf() === ExtentType.MISSION) {
                extent = await getMissionExtentByTitle(missionSelect);
                if (extent) {
                    //note that a mission has extent coordinates but not a spatial reference
                    //this code assumes the current mission SR is the same as the view
                    extent.spatialReference = view.spatialReference;
                }
            } else {
                extent = view.extent;
            }
        }
        return extent;
    };

    /**
     * Find the current map/scene if it exists in the portal items and move it to the first array position
     * @param feeds array of portal items (webScenes or webMaps)
     * @param mapItemTitle the title of the current map or scene in the mission state reducer
     */
    const movePreviouslySelectedItemIntoView = (feeds: DataFeedItem[], mapItemTitle: string) => {
        const index = feeds.findIndex((feed) => feed.portalItem?.title === mapItemTitle);
        if (index !== -1) {
            const element = feeds[index];
            feeds.splice(index, 1);
            feeds.splice(0, 0, element);
        }
    };

    /**
     * Load the feed items over the network based on the query and filter conditions in the UI
     * @param nextStartIndex next position to begin loading items at
     * @param pagingData true if paging or false if the query only pulls 100 items
     */
    const loadFeeds = async (nextStartIndex = 1, pagingData = false) => {
        setIsLoadingFeeds(true);

        //abort previous query, if already completed this has no impact
        if (controller.current) {
            controller.current.abort();
        }
        controller.current = new AbortController();

        const missionFilterValue = hasMission && filterCurrentMission ? missionSelect : undefined;
        loadDataFeeds(
            AppConfig,
            searchValue,
            filterGroups,
            portalGroups,
            itemTypes,
            tags,
            filterMyContent ? portalUser.username : undefined,
            filterMyOrganization,
            filterCurrentMission && missionNameInStateReducer ? missionNameInStateReducer : missionFilterValue,
            filterExtent ? await getFilterExtent() : undefined,
            controller.current.signal,
            categories,
            nextStartIndex
        )
            .then((results) => {
                if (!results) {
                    // If no results return early or null value returned
                    return null;
                } else if (results.type === 'error') {
                    // This is to handles the aborted query case in the catch below
                    throw results;
                }
                let dataFeeds = results.datafeeds;

                if (pagingData) {
                    //cache these results with the results from previous queries, cache size can grow to numberOfRecordsToUseWhenPaging
                    dataFeeds = [...dataFeeds, ...feeds];
                }

                dataFeeds = sortDataFeeds(dataFeeds, sortType, sortDirection);
                missionState &&
                    missionState.mapItem &&
                    movePreviouslySelectedItemIntoView(dataFeeds, missionState?.mapItem.title);
                setFeeds(dataFeeds);
                setNextStart(results.stats.nextStart);

                const numberOfRecordsAvailable = results.stats.recordCount;
                const maxRecordsToCache =
                    numberOfRecordsAvailable < numberOfRecordsToUseWhenPaging
                        ? numberOfRecordsAvailable
                        : numberOfRecordsToUseWhenPaging;
                setTotalRecordCount(maxRecordsToCache);

                !pagingData && setPage(1);
                if (dataFeeds.length === 0) {
                    setIsLoadingFeeds(false);
                }
            })
            .catch((e) => {
                if (promiseUtils.isAbortError(e)) {
                    // ignore
                    console.debug(e.message, e);
                } else {
                    console.error(e.message, e);
                }
                setNextStart(0);
                setTotalRecordCount(0);
            });
    };

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value);
    };

    const handleClearSearch = () => {
        setSearchValue('');
    };

    const handleChangePage = (_event: any, newPage: number) => {
        setPage(newPage);

        /**added to support caching and paging */
        const recordPos = itemsPerPage * newPage;
        if (feeds.length >= totalRecordCount) {
            return; //max number of items are in the cache
        }

        if (useDataPaging && recordPos > nextStart) {
            loadFeeds(nextStart, true);
        }
        // scroll to top of container
        if (dataFeedsContent.current?.scrollTop) {
            dataFeedsContent.current.scrollTop = 0;
        }
    };

    const handleSortChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSortType(parseInt(event.target.value) as SortType);
    };

    const handleSortDirectionChange = () => {
        setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    };

    /**
     * Build a template that holds the action buttons for this type of portal item (webMaps/webScenes)
     * A slight deviation from how data feeds handled template creation because dataFeeds passed the template in the
     * props and then uses a clone method to ingest the feed item
     * Here we specifically create the template passing the item directly as a prop
     * @param feed the current feed item / record
     * @returns a ViewCardActionItems JSX or undefined
     */
    const buildCardActionsTemplate = (feed: DataFeedItem) => {
        if (missionState && dispatch) {
            return (
                <ViewCardActionItems
                    item={feed.portalItem}
                    missionState={missionState}
                    stateSceneId={missionStateSceneId}
                    dispatch={dispatch}
                    categories={categories}
                />
            );
        } else {
            return undefined; //or build some other type of template
        }
    };

    /**
     * Determine if conditions exists to show the filter for Web Map or Web Scene
     * @param viewType type of view associated with object
     * @returns true if the view type filter should be displayed as a filter option otherwise false
     */
    const filterOnViewType = (viewType: string): boolean => {
        return itemTypes.findIndex((item) => item === viewType) !== -1;
    };

    /**
     * Extensibility means that not all filters are relevant and may need to be hidden for certain item types
     * @returns true if the mission filter should be shown in the list of filter types otherwise false
     */
    const showFilterCurrentMission = () => {
        //basically don't show the filter when creating a new mission
        return !(missionNameInStateReducer && missionNameInStateReducer !== missionSelect);
    };

    return (
        <WidgetContainer>
            <WidgetHeader position='static'>
                <InputGroup>
                    <Box hidden={!showFilter}>
                        <Filter
                            isSpatial={isSpatial}
                            filterGroups={filterGroups}
                            setFilterGroups={setFilterGroups}
                            filterMyContent={filterMyContent}
                            setFilterMyContent={setFilterMyContent}
                            filterMyOrganization={filterMyOrganization}
                            setFilterMyOrganization={setFilterMyOrganization}
                            showFilterCurrentMission={showFilterCurrentMission()}
                            filterCurrentMission={filterCurrentMission}
                            setFilterCurrentMission={setFilterCurrentMission}
                            filterExtent={filterExtent}
                            setFilterExtent={setFilterExtent}
                            filterExtentType={filterExtentType}
                            setFilterExtentType={setFilterExtentType}
                            hasMission={hasMission}
                            filterOnIMMADWebMapTag={filterOnViewType('Web Map')}
                            filterOnIMMADWebSceneTag={filterOnViewType('Web Scene')}
                            filterByWebMapOnly={filterByWebMapOnlyTag}
                            setFilterWebMapOnly={setFilterByWebMapOnlyTag}
                            filterByWebSceneOnly={filterByWebSceneOnlyTag}
                            setFilterByWebSceneOnly={setFilterByWebSceneOnlyTag}
                        />
                    </Box>
                    <Box hidden={!showSearch} flexGrow={1}>
                        <InputField
                            variant='outlined'
                            placeholder='Search'
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
                        />
                    </Box>
                    <Box hidden={!showSort}>
                        <InputGroup>
                            <InlineSelect
                                variant='outlined'
                                color='secondary'
                                value={sortType}
                                onChange={handleSortChange}
                            >
                                <MenuItem value={SortType.MODIFIED}>Date Modified</MenuItem>
                                <MenuItem value={SortType.TITLE}>Title</MenuItem>
                                <MenuItem value={SortType.OWNER}>Owner</MenuItem>
                                <MenuItem value={SortType.VIEW_COUNT}>View Count</MenuItem>
                            </InlineSelect>

                            <IconButton onClick={handleSortDirectionChange}>
                                {sortDirection === 'ASC' && <SortAscendingArrowIcon size={16} />}
                                {sortDirection !== 'ASC' && <SortDescendingArrowIcon size={16} />}
                            </IconButton>
                        </InputGroup>
                    </Box>
                </InputGroup>
            </WidgetHeader>

            <WidgetContent elevation={0} ref={dataFeedsContent}>
                {!isLoadingFeeds && feeds.length === 0 && (
                    <Alert severity='info'>
                        No items found that meet your criteria. Try changing your search term or clearing some filters
                        to show more items.
                    </Alert>
                )}

                {!isLoadingFeeds && feeds.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {feeds
                            .slice((page - 1) * itemsPerPage, (page - 1) * itemsPerPage + itemsPerPage)
                            .map((dataFeed) => (
                                <PortalItemCard
                                    item={dataFeed}
                                    cardActionsTemplate={
                                        cardActionsTemplate ? cardActionsTemplate : buildCardActionsTemplate(dataFeed)
                                    }
                                    key={dataFeed.portalItem.id}
                                    useNoneCloneJSX={cardActionsTemplate === undefined}
                                    userSession={userSession}
                                />
                            ))}
                    </div>
                )}
            </WidgetContent>

            <WidgetActions elevation={0} style={{ justifyContent: 'space-between' }} ref={paginationEl}>
                <Grid item style={{ flex: 1, display: paginationSize && paginationSize.width > 500 ? 'flex' : 'none' }}>
                    {isLoadingFeeds && <CircularProgress color='secondary' />}
                </Grid>
                <Grid item style={{ flex: 1, justifyContent: 'center' }}>
                    {feeds.length > 0 && (
                        <StyledPagination
                            count={
                                useDataPaging
                                    ? Math.ceil(totalRecordCount / itemsPerPage)
                                    : Math.ceil(feeds.length / itemsPerPage)
                            }
                            page={page}
                            siblingCount={siblingCount}
                            boundaryCount={useDataPaging ? 0 : 1}
                            onChange={handleChangePage}
                        />
                    )}
                </Grid>
                <Grid
                    item
                    style={{
                        flex: 1,
                        justifyContent: 'flex-end',
                        display: paginationSize && paginationSize.width > 500 ? 'flex' : 'none',
                    }}
                >
                    {feeds.length > 0 && (
                        <Typography>
                            {(page - 1) * itemsPerPage + 1} -{' '}
                            {Math.min((page - 1) * itemsPerPage + itemsPerPage, totalRecordCount)} of {totalRecordCount}
                        </Typography>
                    )}
                </Grid>
            </WidgetActions>
        </WidgetContainer>
    );
}

export default PortalItemList;
