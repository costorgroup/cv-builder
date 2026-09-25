import type { TTextFieldProps } from "@costor/ui";
import type { TCity, TState } from "@/utils/locations-api";

export type TCvLocationFieldsProps = Pick<TTextFieldProps, "variant" | "size">;

/** States fetched for one country. */
export type TStatesResult = { countryCode: string; states: TState[] };

/** Cities found for one search, keyed by country, state and text. */
export type TCitySearch = { key: string; cities: TCity[] };
