import { Theme } from "@emotion/react";

/**
 * Props passed in to the Linear Unit control
 */
export interface LinearUnitProps {
  /* Controls styling for the component
   */
  theme: Theme;

  /* The descriptive label shown on the control
   */
  label: string;

  /* This flag controls whether each sub-component will be disabled
   */
  isDisabled: boolean;

  /* Array of unit values to choose from in the drop-down
   */
  units: string[];

  /* The combined value of the inputs selected in the sub-components, i.e. "1000 Meters"
   */
  fullValue: string;

  /* Callback which is triggered whenever the value in either sub-component changes
   */
  onValueChanged: (combinedValue: string) => void;

  /* Callback which is triggered whenever the component changes with onBlur
   */
  onBlur?: () => void;
}

export declare const LinearUnit: (props: LinearUnitProps) => JSX.Element;
export {};
