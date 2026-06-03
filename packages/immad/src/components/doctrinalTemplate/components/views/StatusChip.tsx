import React from 'react';
import Chip, { ChipProps } from '@mui/material/Chip';
import SuccessIcon from 'calcite-ui-icons-react/CheckIcon';
import WarningIcon from 'calcite-ui-icons-react/ExclamationMarkTriangleIcon';
import ErrorIcon from 'calcite-ui-icons-react/XOctagonIcon';
import styled from 'styled-components';

/**
 * A chips size is driven by a size property that is only defined by the values 'small'
 * or 'medium'.  This makes determining a dynamic size for the icon difficult.  Setting
 * the icon size statically to 16 seems to support both small and medium variants well.
 */
const avatarSize = 16;

/**
 * Defines all the statuses that can be applied to the status chip.
 */
export type ChipStatus = 'default' | 'success' | 'warning' | 'error';

/**
 * Converts the Chip status property value into a valid css color.  This method
 * currently uses calcite color variables but could be adapted to use theme colors
 * if appropriate warning, success, and error, colors are added to the palette.
 * @param status The status being converted.
 */
const statusToCSSColor = (status?: ChipStatus): string => {
    switch (status) {
        case 'success':
            return `var(--calcite-ui-success)`;
        case 'warning':
            return `var(--calcite-ui-warning)`;
        case 'error':
            return `var(--calcite-ui-danger)`;
        default:
            return '';
    }
};

/**
 * Determines to what icon to used based on the supplied chip status.
 * @param status The status used to generate an avatar icon in the StatusChip
 * component.
 */
const statusToAvatar = (status?: ChipStatus): JSX.Element | undefined => {
    switch (status) {
        case 'success':
            return <SuccessIcon size={avatarSize} />;
        case 'warning':
            return <WarningIcon size={avatarSize} />;
        case 'error':
            return <ErrorIcon size={avatarSize} />;
        default:
            return undefined;
    }
};

/**
 * Defines the properties available for the StatusClhip component.
 */
interface StatusChipProps extends ChipProps {
    status?: ChipStatus;
}

/**
 * A customized chip component that contains a status property.  The status property
 * drives the avatar icon portion of a Material UI chip.
 * @param props
 */
const StatusChip = (props: StatusChipProps) => {
    const { status, ...chipProps } = props;

    return <Chip avatar={statusToAvatar(status)} {...chipProps} />;
};

/**
 * An extended version of the StatusChip component that derives the chip color based
 * on the status property.
 */
const StyledStatusChip = styled(StatusChip)`
    &.MuiChip-root {
        color: ${(props) => statusToCSSColor(props.status)};

        .MuiChip-avatar {
            color: ${(props) => statusToCSSColor(props.status)};
            width: ${avatarSize}px;
            height: ${avatarSize}px;
        }
    }

    &.MuiChip-outlined {
        border-color: ${(props) => statusToCSSColor(props.status)};
    }
`;

export default StyledStatusChip;
