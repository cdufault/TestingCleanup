import { Box, Button, FormLabel, InputLabel } from '@mui/material';
import styled from 'styled-components';

const AlphabeticalBox = styled(Box)`
    padding: 5px 5px 5px 0;
`;

const BoxFlex = styled(Box)`
    display: flex;
`;

const ClearFilterButton = styled(Button)`
    color: rgba(255, 255, 255, 0.7);
    padding: 0 0 0 5px;
    font-size: 1.1428571428571428rem;
    font-family: Arial, sans-serif;
    font-weight: 400;
    line-height: 1;
`;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

const DefaultBox = styled(Box)`
    padding 5px;
`;

const Grid = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    flex-wrap: wrap;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    margin-block-end: 1rem;
    padding-block-end: 1rem;
    border-block-end: 1px solid rgba(255, 255, 255, 0.15);
`;

const MissionsContainer = styled.div`
    display: flex;
    overflow: hidden;
    box-sizing: border-box;
    margin-bottom: 2px;
`;

const MissionCardColumn = styled(Grid)`
    margin: 0;
    min-width: 75%;
    max-width: 75%;
    flex-direction: column;
`;

const MissionCardContainer = styled(Grid)`
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    justify-content: space-evenly;
`;

const MissionCategoryColumn = styled(Grid)`
    margin: 0;
    min-width: 300px;
    max-width: 25%;
    flex-flow: column nowrap;
`;

const MissionCategoryContainer = styled.div`
    display: flex;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
`;

const MissionFilterContainer = styled.div`
    display: flex;
    min-height: 45px;
`;

const MissionCountFormLabel = styled(FormLabel)`
    display: flex;
    align-items: center;
    padding: 0 5px 0 0;
`;

const MissionCountContainer = styled.div`
    display: flex;
    flex-direction: row;
    padding-left: 45px;
    min-height: 20px;
`;

const VerticalLine = styled.div`
    border-left: 2px solid rgba(255, 255, 255, 0.7);
    height: 20px;
`;

const SceneCategoryColumn = styled(Grid)`
    margin: 0;
    min-width: 300px;
    max-width: 25%;
    flex-flow: column nowrap;
`;

const SceneCardColumn = styled(Grid)`
    margin: 0;
    min-width: 75%;
    max-width: 75%;
    flex-direction: column;
`;

const SceneCountContainer = styled.div`
    display: flex;
    flex-direction: row;
    padding-left: 5px;
    min-height: 20px;
`;

const SceneCountBox = styled.div`
    display: flex;
    flex-wrap: nowrap;
    margin-bottom: 10px;
`;

const SceneFilterContainer = styled.div`
    display: flex;
    min-height: 45px;
`;

const SceneCountFormLabel = styled(FormLabel)`
    display: flex;
    align-items: center;
    padding: 0 5px 0 15px;
`;

const SceneLoadingBox = styled(Box)`
    margin-top: 140px;
`;

const CategoryLoadingBox = styled(Box)`
    margin: 140px 0 0 30px;
`;

const SearchBox = styled(Box)`
    padding 5px;
    flex: 1;
`;

const SortByBox = styled(Box)`
    display: flex;
    align-items: baseline;
    padding: 0 5px 5px 5px;
`;

const SearchSortGroupBox = styled(Box)`
    display: flex;
    flex: 1;
    height: 45px;
    align-items: center;
`;
const SortByLabel = styled(InputLabel)`
    padding-right: 5px;
    font-size: 1rem;
    font-family: Arial, sans-serif;
    font-weight: 400;
    line-height: 1.43;
    color: #fff;
`;

export {
    AlphabeticalBox,
    BoxFlex,
    CategoryLoadingBox,
    ClearFilterButton,
    Container,
    DefaultBox,
    Grid,
    Header,
    MissionCardColumn,
    SceneCardColumn,
    MissionCategoryColumn,
    MissionCategoryContainer,
    MissionFilterContainer,
    MissionCardContainer,
    SceneCategoryColumn,
    SceneCountContainer,
    SceneCountBox,
    SceneFilterContainer,
    SceneCountFormLabel,
    SceneLoadingBox,
    VerticalLine,
    MissionCountFormLabel,
    MissionCountContainer,
    SearchBox,
    SortByBox,
    SearchSortGroupBox,
    SortByLabel,
    MissionsContainer,
};
