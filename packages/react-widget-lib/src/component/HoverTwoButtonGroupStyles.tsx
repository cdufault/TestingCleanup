import styled from "@emotion/styled";
import { Button, IconButton } from "@mui/material";

const StyledLeftButton = styled(Button)`
  border-right: 1px solid #181d26 !important;
  color: #0daeff;
  border-radius: 33.33px 0 0 33.33px;
  background-color: #262b3d;
  &:hover {
    background-color: #3d445b;
  }
`;

const StyledLeftIconButton = styled(IconButton)`
  border-right: 1px solid #181d26;
  color: #0daeff;
  border-radius: 33.33px 0 0 33.33px;
  padding: 10px 5px 10px;
  background-color: #262b3d;
  &:hover {
    background-color: #3d445b;
  }
`;

const StyledRightButton = styled(Button)`
  border-left: 1px solid #181d26 !important;
  color: #0daeff;
  border-radius: 0 33.33px 33.33px 0;
  background-color: #262b3d;
  border-left: 1px solid #181d26;
  &:hover {
    background-color: #3d445b;
  }
`;

const StyledRightIconButton = styled(IconButton)`
  border-left: 1px solid #181d26;
  color: #0daeff;
  border-radius: 0 33.33px 33.33px 0;
  background-color: #262b3d;
  padding: 10px 5px 10px;
  width: 47.5px;
  &:hover {
    background-color: #3d445b;
  }
  &:disabled {
    color: #1f485c;
    background-color: #262b3d;
  }
`;

const StyledHoverButton = styled(Button)`
  border-radius: 33.33px;
  border-color: transparent;
  background-color: #262b3d;
  color: #0daeff;
`;

const StyledHoverIconButton = styled(IconButton)`
  border: 1px solid #181d26;
  color: #0daeff;
  border-radius: 33.33px;
  background-color: #262b3d;
  width: 36.5px;
  &:hover {
    background-color: #3d445b;
  }
`;

export {
  StyledLeftButton,
  StyledRightIconButton,
  StyledLeftIconButton,
  StyledRightButton,
  StyledHoverButton,
  StyledHoverIconButton,
};
