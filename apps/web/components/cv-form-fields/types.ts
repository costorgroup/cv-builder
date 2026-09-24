import type {
  TCheckBoxProps,
  TDatePickerFieldProps,
  TSelectProps,
  TTextAreaProps,
  TTextFieldProps,
} from "@costor/ui";
import type { FieldPath } from "react-hook-form";
import type { TCvData } from "@/providers/cv-provider/types";

/** Path of a field in the CV form, e.g. `workExperience.0.position`. */
export type TCvFieldName = FieldPath<TCvData>;

/** Props every CV form field takes; value, change and errors come from the form. */
type TCvFieldBaseProps = {
  name: TCvFieldName;
  /** Also used in the "is required" message. */
  label: string;
  required?: boolean;
};

type TControlledProps =
  | "name"
  | "label"
  | "required"
  | "value"
  | "defaultValue"
  | "onChange"
  | "onBlur"
  | "error"
  | "helperText";

export type TCvTextFieldProps = Omit<TTextFieldProps, TControlledProps> &
  TCvFieldBaseProps;

export type TCvTextAreaProps = Omit<TTextAreaProps, TControlledProps> &
  TCvFieldBaseProps;

export type TCvCheckBoxProps = Omit<
  TCheckBoxProps,
  TControlledProps | "checked" | "defaultChecked"
> &
  TCvFieldBaseProps;

export type TCvDateFieldProps = Omit<
  TDatePickerFieldProps,
  TControlledProps | "minDate" | "maxDate" | "mode"
> &
  TCvFieldBaseProps & {
    /** Earliest selectable date, as a CV date string (`YYYY-MM-DD`). */
    minDate?: string;
  };

export type TCvSelectFieldProps<T> = Omit<TSelectProps<T>, TControlledProps> &
  TCvFieldBaseProps;
