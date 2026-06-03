/**The Properties for the HoverTwoButtonGroup details */
export interface HoverTwoButtonGroupProps {
    rightButtonLabel: string;
    leftButtonLabel: string;
    hoverButtonLabel: string;
    onRightButtonClick: () => void;
    onLeftButtonClick: () => void;
    rightButtonIcon?: JSX.Element;
    leftButtonIcon?: JSX.Element;
    hoverButtonIcon?: JSX.Element;
    width?: string;
    iconWidth?: string;
    height?: string;
    iconHeight?: string;
    disable3dButton?: boolean;
}
export declare const HoverTwoButtonGroup: (props: HoverTwoButtonGroupProps) => JSX.Element;
