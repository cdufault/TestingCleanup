import React from 'react';

import { Box, IconButton } from '@mui/material';
import DynamicClassificationOnIcon_1 from '../../../images/24px/24px_dynamic-classification_on_1.png';
import DynamicClassificationOffIcon_1 from '../../../images/24px/24px_dynamic-classification_off_1.png';

interface DynamicClassificationToggleProps {
    enabled: boolean;
    onClick: () => void;
}

// Component
export default function DynamicClassificationToggle(props: DynamicClassificationToggleProps): JSX.Element {
    const tooltip = `Dynamic Classification ${!props.enabled ? 'Off' : 'On'}`;
    return (
        <div>
            <Box title={tooltip}>
                <span>
                    <IconButton
                        aria-label={tooltip}
                        size='small'
                        onClick={props.onClick}
                        style={{ marginInline: '1rem' }}
                    >
                        {props.enabled ? (
                            <img
                                src={DynamicClassificationOnIcon_1}
                                alt={'DynamicClassification'}
                                style={{ width: 24, height: 24 }}
                            />
                        ) : (
                            <img
                                src={DynamicClassificationOffIcon_1}
                                alt={'DynamicClassification'}
                                style={{ width: 24, height: 24 }}
                            />
                        )}
                    </IconButton>
                </span>
            </Box>
        </div>
    );
}
