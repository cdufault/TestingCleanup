import React, { useState } from "react";
import { Box, ButtonGroup } from "@mui/material";
import {
  StyledHoverButton,
  StyledLeftButton,
  StyledLeftIconButton,
  StyledRightIconButton,
  StyledRightButton,
  StyledHoverIconButton,
} from "./HoverTwoButtonGroupStyles";

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

export const HoverTwoButtonGroup = (
  props: HoverTwoButtonGroupProps
): JSX.Element => {
  const {
    width = "auto",
    iconWidth = "auto",
    height = "auto",
    iconHeight = "auto",
    rightButtonLabel,
    leftButtonLabel,
    onRightButtonClick,
    onLeftButtonClick,
    hoverButtonLabel,
    rightButtonIcon,
    leftButtonIcon,
    hoverButtonIcon,
    disable3dButton,
  } = props;
  const [hover, setHover] = useState(false);

  return (
    <Box
      className={"region-card-content-button-group"}
      display="flex"
      justifyContent="center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover ? (
        <ButtonGroup
          variant="contained"
          style={{ width: `${width}`, height: `${height}` }}
        >
          {leftButtonIcon ? (
            <StyledLeftIconButton
              style={{ width: `${iconWidth}`, height: `${iconHeight}` }}
              onClick={() => {
                if (onLeftButtonClick) onLeftButtonClick();
              }}
              title={leftButtonLabel}
            >
              {leftButtonIcon}
            </StyledLeftIconButton>
          ) : (
            <StyledLeftButton
              style={{ width: `${iconWidth}`, height: `${iconHeight}` }}
              onClick={() => {
                if (onLeftButtonClick) onLeftButtonClick();
              }}
              title={leftButtonLabel}
            >
              {leftButtonLabel}
            </StyledLeftButton>
          )}
          {rightButtonIcon ? (
            <StyledRightIconButton
              style={{ width: `${iconWidth}`, height: `${iconHeight}` }}
              onClick={() => {
                if (onRightButtonClick) onRightButtonClick();
              }}
              title={rightButtonLabel}
              disabled={disable3dButton}
            >
              {rightButtonIcon}
            </StyledRightIconButton>
          ) : (
            <StyledRightButton
              style={{ width: `${iconWidth}`, height: `${iconHeight}` }}
              onClick={() => {
                if (onRightButtonClick) onRightButtonClick();
              }}
              title={rightButtonLabel}
              disabled={disable3dButton}
            >
              {rightButtonLabel}
            </StyledRightButton>
          )}
        </ButtonGroup>
      ) : (
        <>
          {hoverButtonIcon ? (
            <StyledHoverIconButton
              title={hoverButtonLabel}
              style={{ width: `${width}`, height: `${height}` }}
            >
              {hoverButtonIcon}
            </StyledHoverIconButton>
          ) : (
            <StyledHoverButton
              variant="outlined"
              style={{ width: `${width}`, height: `${height}` }}
            >
              {hoverButtonLabel}
            </StyledHoverButton>
          )}
        </>
      )}
    </Box>
  );
};
