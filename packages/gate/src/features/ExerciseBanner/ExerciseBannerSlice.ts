import { createSlice } from '@reduxjs/toolkit';

export interface BannerState {
    active: boolean;
}

const initialState: BannerState = {
    active: false,
};

export const exerciseBannerSlice = createSlice({
    name: 'exerciseBanner',
    initialState: initialState as BannerState,
    reducers: {
        setActive: (state) => {
            state.active = !state.active;
        },
    },
});

export const { setActive } = exerciseBannerSlice.actions;
export default exerciseBannerSlice.reducer;
