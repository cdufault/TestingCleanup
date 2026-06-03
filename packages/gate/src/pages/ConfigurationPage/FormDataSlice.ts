import { createSlice } from '@reduxjs/toolkit';
import { GateDynamicConfig } from '../../ApplicationSlice';

/** the GATE Dynamic Configuration values for storing in the GATE Application */
const initialState: GateDynamicConfig = {
    regionFeatureClassId: '',
    landingPageCategoriesFeatureClassId: '',
    gateCalendarFeatureClassId: '',
    j2SummaryFeatureClassId: '',
    sourcesFeatureClassId: '',
    analystCommentsFeatureClassId: '',
    j2AssessmentAlias: '',
    analystCommentsAlias: '',
    brandingTitleAlias: '',
    brandingSubtitleAlias: '',
    brandingLogo: '',
    highInterestEventCardTitle: 'High Interest Events',
    dynamicLayerServiceDefaultExpirationTimeHrs: 0,
    dynamicLayerServiceId: undefined,
    dynamicLayerServicePollIntervalMins: 0,
    systemHighClassification: '',
    opsClockList: [],
    presentationModeUpdateIntervalMinutes: '',
    carouselPagingUpdateIntervalMinutes: '',
    landingPageUpdateIntervalInMinutes: '',
    updateFrequencyForAnalystCommentCategoryInMinutes: '',
    lowActivitySnapshotCategoryColor: '#4e6cbb',
    moderateActivitySnapshotCategoryColor: '#be7a2b',
    highActivitySnapshotCategoryColor: '#ec6338',
};

/**Holds the data and actions for updating relevant to the configuration form data. */
export const formDataSlice = createSlice({
    name: 'formData',
    initialState: initialState,
    reducers: {
        updateFormData: (state, action) => {
            return { ...state, ...action.payload };
        },
    },
});

export const { updateFormData } = formDataSlice.actions;

export default formDataSlice.reducer;
