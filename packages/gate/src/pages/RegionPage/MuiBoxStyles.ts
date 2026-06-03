import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';

export const CenterBox = styled(Box)`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
`;
export const CenterBoxCols = styled(CenterBox)`
    flex-direction: column;
`;
export const TabBox = styled(Box)`
    height: 100%;
    background-color: lightgray;
`;
export const RegionBox = styled(Box)`
    background-color: black;
    display: flex;
    flex-direction: column;
    height: 100%;
`;

export const StyledAnalystCommentsWidgetBox = styled(Box)`
    display: flex;
    flex-direction: column;
    color: black;
    padding-right: 20px;
    background-color: lightgray;
    padding-left: 25px;
    padding-top: 5px;
    overflow: auto;
    padding-bottom: 20px;
    position: relative;
    height: 100%;
`;
export const StyledRegionToolbarBox = styled(Box)`
    width: 50px;
    left: 0;
    position: relative;
    display: flex;
    background-color: black;
    padding-top: 40px;
    padding-left: 5px;
`;
export const StyledTheMainContentBox = styled(Box)`
    flex: 1 0 auto;
    display: flex;
`;
export const StyledFlexLayoutParentBox = styled(Box)`
    width: 100%;
    position: relative;
    min-height: calc(100vh - (2 * (10px + 7vmin)));
`;
export const StyledExerciseFlexLayoutParentBox = styled(Box)`
    width: 100%;
    position: relative;
    min-height: calc(100vh - (2 * (10px + 8vmin)));
`;
export const StyledRegionPageToolbarToggleButton = styled(ToggleButton)`
    // after user turns it off
    &:hover {
        background-color: ${(p) => '#383f53'};
        color: ${(p) => '#0daeff'};
    }
    //default state when page loads
    &.Mui-selected {
        background-color: ${(p) => '#0493d9'};
        color: ${(p) => '#ffffff'};

        &:hover {
            background-color: ${(p) => '#0daeff'};
            color: ${(p) => '#ffffff'};
        }
    }
`;

export const StyledRegionPageToolbarResetButton = styled(ToggleButton)`
    // after user turns it off
    &:hover {
        background-color: ${(p) => '#383f53'};
        color: ${(p) => '#0daeff'};
    }
`;

export const StyledRegionPageToolbarSaveButton = styled(ToggleButton)`
    // after user turns it off
    &:hover {
        background-color: ${(p) => '#383f53'};
        color: ${(p) => '#0daeff'};
    }
`;
