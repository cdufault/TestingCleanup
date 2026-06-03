import styled from 'styled-components';

import { default as MuiButton } from '@mui/material/Button';
import { WidgetContent } from '../../common';

const Button = styled(MuiButton)`
    margin-top: 0.5rem;
`;

const MeasureWidgetContent = styled(WidgetContent)`
    .esri-direct-line-measurement-3d__measurement {
        background-color: var(--calcite-ui-background);
    }
`;

export { Button, MeasureWidgetContent };
