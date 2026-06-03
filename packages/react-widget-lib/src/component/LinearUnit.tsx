import React, { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { LinearUnitProps } from "../../types/LinearUnit";
import styled from "@emotion/styled";
import { ThemeProvider } from "@emotion/react";
/*
 * A re-usable Linear Unit control that combines a numeric input and unit selection drop-down.
 * @param props The Linear Unit props to provide to the control.
 */
export const LinearUnit = (
  props: LinearUnitProps & { onBlur?: () => void }
): JSX.Element => {
  const StyledRowContainer = styled.div`
    display: flex;
    justify-content: space-between;
    flex-direction: row;
  `;
  const [number, setNumber] = useState("");
  const [unit, setUnit] = useState("");
  // Sync local state when parent fullValue changes
  useEffect(() => {
    const [n, ...u] = props.fullValue.split(" ");
    setNumber(n);
    setUnit(u.join(" ") || "");
  }, [props.fullValue]);
  // Commit change when focus leaves the entire component
  const commitChange = () => {
    const newFullValue = `${number} ${unit}`.trim();
    if (!props.isDisabled && newFullValue !== props.fullValue) {
      props.onValueChanged(newFullValue);
    }
    if (props.onBlur) {
      props.onBlur();
    }
  };
  const handleContainerBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // Only commit if focus is moving *outside* the whole control
    if (!e.currentTarget.contains(e.relatedTarget)) {
      commitChange();
    }
  };
  /* Given the full linear unit value string, i.e. "1000 Meters", return the number value, i.e. "1000".
   * Returns the original string if there are no spaces.
   */
  const getNumberValueFromFullValue = (fullValue: string): string => {
    return fullValue.split(" ")[0];
  };

  /* Given the full linear unit value string, i.e. "1000 Meters", return the unit value, i.e. "Meters".
   * Returns the original string if there are no spaces.
   */
  const getUnitValueFromFullValue = (fullValue: string): string => {
    const valueArray = fullValue.split(" ");
    if (valueArray.length > 1) {
      return valueArray[1];
    } else {
      return valueArray[0];
    }
  };
  return (
    <ThemeProvider theme={props.theme}>
      <StyledRowContainer onBlur={handleContainerBlur}>
        <TextField
          label={props.label}
          type="number"
          value={number}
          disabled={props.isDisabled}
          onChange={(event) => setNumber(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitChange();
            }
          }}
          sx={{ mt: 1, mb: 1, width: 400 }}
        />
        <Autocomplete
          sx={{ mt: 1, mb: 1, width: 200 }}
          options={props.units}
          value={unit}
          disabled={props.isDisabled}
          onChange={(event, newValue) => {
            if (newValue) {
              setUnit(newValue);
            }
          }}
          renderInput={(params) => <TextField {...params} label="Units" />}
        />
      </StyledRowContainer>
    </ThemeProvider>
  );
};
