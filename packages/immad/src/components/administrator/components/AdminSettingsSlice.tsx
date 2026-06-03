import { createSlice } from '@reduxjs/toolkit';
import { AnalyticsGPTool } from '../../../interfaces/AnalyticsGPTypes';
import AnalyticToolParamControls from './AnalyticToolParamControls';

/**
 * describes a fragment RMT featureclass fields object.
 */
export interface RMTFtrClassField {
    alias: string;
    name: string;
    fieldType: string;
}

//tbd based on MReynolds final design
export interface ICode {
    type: string;
    codeAlias: string;
    queryLabels: string[];
}
//tbd based on MReynolds final design
export interface INewtType {
    rmtType: string;
    codes: ICode[];
}

/**
 * the fields needed to support querying RMT data sources
 */
export interface RMTQueryField {
    label: string; //will display on the UI field select
    selectedFieldObj: RMTFtrClassField;
}

/**describes the format of RMT code data */
export interface RMTCodeTypeQueryMetadata {
    portalItemId: string; //data source for the RMT type
    id: string; //only used in UI generation in the admin panel
    queryFields: RMTQueryField[];
    newtCode: string; //ie waterMessageCode, ...
    codeAlias: string; //Display name for newtCode
}

/**describes a RMT message type and it's associated code types, data is stored on the portal application object */
export interface RMTQueryMetadata {
    rmtMessageType: string;
    codeTypes: RMTCodeTypeQueryMetadata[];
    actionPhrase: string;
    trailingPhrase: string;
}

/* describes the admin settings data slice */
export interface AdminSettingsData {
    rmtQueryMetadata: RMTQueryMetadata[];
    rmtMessageTable: string;
    gateApplicationId: string;
    savedState: {
        itemId: string;
    };
    pushToLayerSettings: {
        pollingInterval: number;
        dynamicServiceLayerId: string;
        defaultExpirationTimeHrs: number;
    };
    analyticToolSettings: AnalyticsGPTool[];
}

/**initial admin settings data */
const initialState: AdminSettingsData = {
    rmtMessageTable: '',
    rmtQueryMetadata: [],
    gateApplicationId: '',
    savedState: {
        itemId: '',
    },
    pushToLayerSettings: {
        pollingInterval: 5,
        dynamicServiceLayerId: '',
        defaultExpirationTimeHrs: 24,
    },
    analyticToolSettings: [],
};

/** to track admin settings data across the application */
export const adminSettingsSlice = createSlice({
    name: 'adminSettingsSlice',
    initialState: initialState,
    reducers: {
        setRMTMessageTable: (state, action) => {
            state.rmtMessageTable = action.payload;
        },
        //currently set when the app loads (index.tsx) and in the RMTSettingPage
        setRMTData: (state, action) => {
            state.rmtQueryMetadata = action.payload;
        },
        updateActionPhrase: (state, action) => {
            const rmtQueryMetadataItem = state.rmtQueryMetadata.find(
                (data) => data.rmtMessageType === action.payload.messageType
            );
            if (rmtQueryMetadataItem) {
                rmtQueryMetadataItem.actionPhrase = action.payload.actionPhrase;
            } else {
                console.error('Failed to find the RMTMetadataItem for message type: ', action.payload.messageType);
            }
        },
        updateTrailingPhrase: (state, action) => {
            const rmtQueryMetadataItem = state.rmtQueryMetadata.find(
                (data) => data.rmtMessageType === action.payload.messageType
            );
            if (rmtQueryMetadataItem) {
                rmtQueryMetadataItem.trailingPhrase = action.payload.trailingPhrase;
            } else {
                console.error('Failed to find the RMTMetadataItem for message type: ', action.payload.messageType);
            }
        },
        updateCodeAlias: (state, action) => {
            const rmtQueryMetadataItem = state.rmtQueryMetadata.find(
                (data) => data.rmtMessageType === action.payload.messageType
            );
            const codeType = rmtQueryMetadataItem?.codeTypes.find((data) => data.newtCode === action.payload.newtCode);
            if (rmtQueryMetadataItem && codeType) {
                codeType.codeAlias = action.payload.codeAlias;
            } else {
                console.error(
                    `Failed to find one or more RMT data items- messageType: ${action.payload.messageType} codeType: ${action.payload.codeType}`
                );
            }
        },
        updatePortalItemId: (state, action) => {
            const rmtQueryMetadataItem = state.rmtQueryMetadata.find(
                (data) => data.rmtMessageType === action.payload.messageType
            );
            const codeType = rmtQueryMetadataItem?.codeTypes.find((data) => data.newtCode === action.payload.newtCode);
            if (rmtQueryMetadataItem && codeType) {
                codeType.portalItemId = action.payload.portalItemId;
            } else {
                console.error(
                    `Failed to find one or more RMT data items- messageType: ${action.payload.messageType} codeType: ${action.payload.codeType}`
                );
            }
        },
        updateQueryFieldObj: (state, action) => {
            const rmtQueryMetadataItem = state.rmtQueryMetadata.find(
                (data) => data.rmtMessageType === action.payload.messageType
            );
            const codeType = rmtQueryMetadataItem?.codeTypes.find((data) => data.newtCode === action.payload.newtCode);
            const queryField = codeType?.queryFields.find((qField) => qField.label === action.payload.queryFieldLabel);
            if (queryField) {
                queryField.selectedFieldObj.name = action.payload.queryFieldObj.name;
                queryField.selectedFieldObj.alias = action.payload.queryFieldObj.alias;
                queryField.selectedFieldObj.fieldType = action.payload.queryFieldObj.fieldType;
            } else {
                console.error(
                    `Failed to find the RMT query type for messageType: ${action.payload.messageType} codeType: ${action.payload.codeType}`
                );
            }
        },
        updateSavedStateConfig: (state, action) => {
            state.savedState = action.payload;
        },
        setGateApplicationId: (state, action) => {
            state.gateApplicationId = action.payload;
        },
        updateAnalyticToolSettings: (state, action) => {
            state.analyticToolSettings = action.payload;
        },
        // TODO: update System Settings Page to use this RTK reducer
        setAppSettingsSavedState: (state, action) => {
            state.savedState = action.payload;
        },
        setSliceDynamicServicelayerId: (state, action) => {
            state.pushToLayerSettings.dynamicServiceLayerId = action.payload;
        },
        setSlicePollingInterval: (state, action) => {
            state.pushToLayerSettings.pollingInterval = action.payload;
        },
        setSliceDefaultExpirationTimeHrs: (state, action) => {
            state.pushToLayerSettings.defaultExpirationTimeHrs = action.payload;
        },
        updateAnalyticToolParameter: (state, action) => {
            const { toolId, name, value } = action.payload;
            const tool = state.analyticToolSettings.find((tool) => tool.toolId === toolId);
            if (!tool) return;

            const param = tool.parameters.find((param) => param.name === name);
            if (!param) return;
            param.value = value;
        },
    },
});

export const {
    setRMTData,
    setRMTMessageTable,
    setGateApplicationId,
    updateAnalyticToolSettings,
    updateSavedStateConfig,
    setAppSettingsSavedState,
    setSliceDynamicServicelayerId,
    setSlicePollingInterval,
    setSliceDefaultExpirationTimeHrs,
    updateActionPhrase,
    updateTrailingPhrase,
    updatePortalItemId,
    updateQueryFieldObj,
    updateCodeAlias,
    updateAnalyticToolParameter,
} = adminSettingsSlice.actions;

export default adminSettingsSlice.reducer;
