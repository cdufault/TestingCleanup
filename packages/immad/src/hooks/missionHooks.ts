import { useState, useRef, useEffect } from 'react';
import { getPortalBasemaps } from '../helpers/mapHelper';
import { ConfigHelper } from '../helpers/configHelper';
import { findPortalItemsByTag, findPortalItemsByType } from '../helpers/portalItemsHelper';
import { findPortalGroupsByTag } from '../helpers/portalGroupHelper';
import { IGroupUsersResult, IItem, ISearchResult, IUser } from '@esri/arcgis-rest-portal';
import { findPortalUsers, getPortalGroupUsers, getAllGroupUsersByGroupId } from '../helpers/portalUsersHelper';
import { findGroupContent } from '../components/home/components/missionCreate/helpers/missionCreationViewModel';

/**
 * describes output consisting of group member admins and mission managers
 */
export interface IMgrsAndAdmins {
    admins: IGroupUsersResult;
    missionMgrs: IGroupUsersResult;
}

/**
 * Type of GATE missions that can be defined
 * */
export type MissionType = 'GATE Mission' | 'IMMAD Mission';

/**
 * Type of GATE maps that can be defined
 * */
export type GateMapType = '3D' | '2D' | undefined;

/**
 * Tactical Grid specific layer
 */
export interface TacticalGridLayer {
    id: string;
    title: string;
    type: string;
}

/**
 * Properties used when tactical grid is being created
 */
export interface TacticalGridProps {
    layers: TacticalGridLayer[];
    defaultGridId: string;
    defaultFieldMappings: any[];
}

/**
 * Collect all the basemaps in the portal.
 */
export function useBasemaps(): { basemaps: IItem[]; refreshBasemaps: () => void } {
    const [basemaps, setBasemaps] = useState<IItem[]>([]);

    async function getBasemaps() {
        const results = await getPortalBasemaps();
        setBasemaps(results.item as IItem[]);
    }

    useEffect(() => {
        getBasemaps();
    }, []);

    const refresh = function () {
        setBasemaps([]);
        getBasemaps();
    };

    return { basemaps: basemaps, refreshBasemaps: refresh };
}

/**
 * Get all the portal webscenes.
 */
export async function getWebScenes(): Promise<ISearchResult<IItem> | undefined> {
    const result = await findPortalItemsByType('Web Scene');
    return result;
}

/**
 * Get all the portal layers with the tactical grid tag.
 */
export async function getTacticalGridLayers(): Promise<TacticalGridProps> {
    const config = ConfigHelper.getAppConfig();
    const results = await findPortalItemsByTag(config.tags.tacticalGrid);
    const items: TacticalGridLayer[] = [];
    results.forEach((result) => {
        const item = {
            id: result.id,
            title: result.title,
            type: result.type,
        };
        items.push(item);
    });
    const defaultGridId = config.tacticalGrid.dataLayerId;
    const defaultMappings = config.tacticalGrid.defaultFieldMappings;

    return {
        layers: items,
        defaultGridId: defaultGridId,
        defaultFieldMappings: defaultMappings,
    };
}

/**
 * Get the scenes or webmap that the current user owns
 * @param type type of GATE mission 3D or 2D
 * @param currentUser current user
 */
export async function getGateMapItems(
    type: GateMapType,
    currentUser: string | undefined
): Promise<ISearchResult<IItem> | undefined> {
    const itemType = type === '3D' ? 'Web Scene' : type === '2D' ? 'Web Map' : undefined;
    if (itemType === undefined || currentUser === undefined) {
        return undefined;
    }
    const result = await findPortalItemsByType(itemType, 'owner', currentUser);
    return result;
}

export function useWebScenes(): { scenes: IItem[]; refreshScenes: () => void } {
    const [scenes, setScenes] = useState<IItem[]>([]);

    async function getScenes() {
        const result = await findPortalItemsByType('Web Scene');
        setScenes(result ? result.results : []);
    }

    useEffect(() => {
        getScenes();
    }, []);

    const refresh = function () {
        setScenes([]);
        getScenes();
    };

    return { scenes: scenes, refreshScenes: refresh };
}

export function useMissions(): {
    missions: IItem[];
    filteredMissions: IItem[];
    filterApplied: boolean;
    setFilteredMissions: (filteredMissions: IItem[]) => void;
    setFilterApplied: (apply: boolean) => void;
    setMissions: (missions: IItem[]) => void;
    originalMissionCount: number;
} {
    const [missions, setMissions] = useState<IItem[]>([]);
    const [filteredMissions, setFilteredMissions] = useState<IItem[]>([]);
    const [filterApplied, setFilterApplied] = useState<boolean>(false);
    const [originalMissionCount, setOriginalMissionCount] = useState(-1);

    useEffect(() => {
        setFilteredMissions(missions);
        setOriginalMissionCount(missions.length);
    }, [missions]);

    return {
        missions,
        filteredMissions,
        filterApplied,
        setFilteredMissions,
        setFilterApplied,
        setMissions,
        originalMissionCount,
    };
}

/**
 * Get all IMMAD users in the mission managers group and the admin group
 * @returns Promise IMgrsAndAdmins
 */
export async function getMMgrAndAdminUserNames(): Promise<IMgrsAndAdmins> {
    const config = ConfigHelper.getAppConfig();

    const missionMgrMembers = await getMMgrGroupMemberNames(config.roles.missionManager.tag);
    const adminMembers = await getAdminGroupMemberNames(config.roles.admin.tag);
    return { admins: adminMembers, missionMgrs: missionMgrMembers };
}

/**
 * Retrieve all group users that are in the portal mission managers group
 * @param tag configuration tag for mission managers
 * @returns IGroupUsersResult promise
 */
export async function getMMgrGroupMemberNames(tag: string): Promise<IGroupUsersResult> {
    const missionManagers = await findPortalGroupsByTag(tag);
    const missionMgrMembers =
        missionManagers.success && missionManagers.item[0]
            ? await getPortalGroupUsers(missionManagers.item[0].id)
            : { users: [], admins: [], owner: '' };
    return missionMgrMembers;
}

/**
 * Retrieve all group users that are in the portal admin group
 * @param tag configuration tag for admins
 * @returns IGroupUsersResult promise
 */
export async function getAdminGroupMemberNames(tag: string): Promise<IGroupUsersResult> {
    const admins = await findPortalGroupsByTag(tag);
    const adminMembers =
        admins.success && admins.item[0]
            ? await getPortalGroupUsers(admins.item[0].id)
            : { users: [], admins: [], owner: '' };
    return adminMembers;
}

export type userRoleType = 'analyst' | 'manager' | '';
export type keyPropType = 'id' | 'userRole';

export interface ImmadAnalyst {
    id: string;
    lastLogin: string;
    userRole: userRoleType;
}
export function useAnalysts(): { users: ImmadAnalyst[]; refreshAnalysts: () => void } {
    //IMMAD-Analyst, IMMAD-MissionManager, IMMAD-Admin
    const [users, setUsers] = useState<ImmadAnalyst[]>([]);

    async function getAnalysts() {
        const results = await findPortalUsers();
        setUsers(results.users.sort());
    }

    async function getAllUsersInAnalystGroup() {
        const config = ConfigHelper.getAppConfig();
        const analysts = await findPortalGroupsByTag(config.roles.analyst.tag);
        const analystUsers: ISearchResult<IUser> | undefined = analysts.success
            ? await getAllGroupUsersByGroupId(analysts.item[0].id)
            : undefined;
        const userObj: ImmadAnalyst[] = [];
        if (analystUsers) {
            analystUsers.results.map((user) => {
                if (user.username) {
                    userObj.push({
                        id: user.username,
                        lastLogin: user.lastLogin ? new Date(user.lastLogin).toString() : '',
                        userRole: '',
                    });
                    console.log(user.username);
                }
            });
        }
        setUsers(userObj);
    }

    useEffect(() => {
        getAllUsersInAnalystGroup();
    }, []);

    const refresh = function () {
        setUsers([]);
        getAnalysts();
    };

    return { users: users, refreshAnalysts: refresh };
}

export function useFeeds(): { feeds: IItem[]; refreshFeeds: () => void } {
    const [feeds, setFeeds] = useState<IItem[]>([]);

    async function getFeeds() {
        const config = await ConfigHelper.getAppConfig();
        const results = await findPortalItemsByTag(config.tags.dataFeed);
        const r = await findPortalGroupsByTag(config.roles.analyst.tag);
        const fsContent = await findGroupContent(r.item[0].id, 'Feature Service', 'Feature Layer');

        //can't save an image service to a scene at this JS release 4.19 unless it is a cached image service and declared as a TileLayer
        const fsFeeds = results.filter((result) => result.type === 'Feature Service');
        const allFeeds = [...fsFeeds, ...fsContent];

        const filteredFeeds = allFeeds.reduce((acc, feed) => {
            const isDup = acc.find((ffeed) => ffeed.id === feed.id);
            if (isDup === undefined || isDup === null) {
                acc.push(feed);
                return acc;
            } else {
                return acc;
            }
        }, []);
        //const feeds = new Set(allFeeds);
        //setFeeds(Array.from(feeds));
        setFeeds(filteredFeeds);
    }

    useEffect(() => {
        getFeeds();
    }, []);

    const refresh = function () {
        setFeeds([]);
        getFeeds();
    };

    return { feeds: feeds, refreshFeeds: refresh };
}

export function useAnalytics(): { analytics: IItem[]; refreshAnalytics: () => void; methodCompleted: boolean } {
    const [analytics, setAnalytics] = useState<IItem[]>([]);
    const methodCompleted = useRef(false);
    async function getAnalytics() {
        const config = await ConfigHelper.getAppConfig();
        const results = await findPortalItemsByTag(config.tags.webTool);
        methodCompleted.current = true;
        setAnalytics(results);
    }

    useEffect(() => {
        getAnalytics();
    }, []);

    const refresh = function () {
        setAnalytics([]);
        getAnalytics();
    };

    return { analytics: analytics, refreshAnalytics: refresh, methodCompleted: methodCompleted.current };
}
