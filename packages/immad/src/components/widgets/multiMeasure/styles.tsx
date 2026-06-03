import styled from 'styled-components';

import { default as MuiButton } from '@mui/material/Button';
import { WidgetContent } from '../../common';

const Button = styled(MuiButton)`
    margin-top: 0.5rem;
`;

const MeasureWidgetContent = styled(WidgetContent)`
    .esri-direct-line-measurement-3d__container,
    .esri-distance-measurement-2d__container,
    .esri-area-measurement-2d__container,
    .esri-area-measurement-3d__container {
        padding: 0 0 5px 0;
    }
    .esri-direct-line-measurement-3d__measurement,
    .esri-distance-measurement-2d__measurement,
    .esri-area-measurement-2d__measurement,
    .esri-area-measurement-3d__measurement {
        background-color: var(--calcite-ui-background);
        margin: 0;
        padding: 0 15px;
    }
`;

export { Button, MeasureWidgetContent };
