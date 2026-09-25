"use client";

import { useEffect, useMemo, useState } from "react";
import { AutoComplete, defaultFilterOptions, GridCell } from "@costor/ui";
import { useController, useFormContext, useWatch } from "react-hook-form";
import { CvTextField } from "@/components/cv-form-fields";
import { NO_AUTOFILL } from "@/utils/no-autofill";
import type {
  TCitySearch,
  TCvLocationFieldsProps,
  TStatesResult,
} from "@/components/cv-location-fields/types";
import type { TCvData } from "@/providers/cv-provider/types";
import {
  locationsApi,
  type TCity,
  type TCountry,
  type TState,
} from "@/utils/locations-api";

const CITY_SEARCH_DELAY_MS = 250;
const COUNTRY = "personalInformation.country";
const STATE = "personalInformation.state";
const CITY = "personalInformation.city";

/** The server already filtered the cities; don't filter them again. */
const keepAll = <T,>(options: T[]) => options;

/**
 * The text in an AutoComplete: what the user is typing while they type,
 * otherwise the picked value. (The field only shows a value it picked
 * itself, not one set by the form, e.g. a saved CV or a filled-in state.)
 *
 * The text goes back to the value when the list closes, not on blur: blur
 * fires as an option is pressed, and swapping the list then loses the click.
 * Emptying the text and closing the list clears the value.
 */
const useFieldText = (valueLabel: string, clear: () => void) => {
  const [draft, setDraft] = useState<string | null>(null);
  return {
    /** What was typed; empty when showing the value. */
    query: draft ?? "",
    typing: draft !== null,
    inputProps: {
      inputValue: draft ?? valueLabel,
      onInputChange: (text: string) =>
        setDraft(text === valueLabel ? null : text),
      onOpenChange: (open: boolean) => {
        if (open) return;
        if (draft?.trim() === "" && valueLabel) clear();
        setDraft(null);
      },
    },
    reset: () => setDraft(null),
  };
};

/**
 * The fields are for picking from our lists, so the browser's own address
 * autofill (which covers the dropdown) is turned off. The component doesn't
 * take input props, hence the ref.
 */
const noAutofill = (root: HTMLDivElement | null) =>
  root?.querySelector("input")?.setAttribute("autocomplete", NO_AUTOFILL);

/** All options until the user types, then the usual label match. */
const filterWhileTyping =
  <T,>(typing: boolean) =>
  (
    options: T[],
    state: { inputValue: string; getOptionLabel: (option: T) => string },
  ) =>
    typing ? defaultFilterOptions(options, state) : options;

const cityLabel = ({ name, state }: TCity) =>
  state ? `${name} (${state.name})` : name;

/**
 * Country (required), state, city and zip. The lists come from the API; the
 * form keeps the picked names, which is what the CV shows. Changing the
 * country clears the state and city, and changing the state clears the city.
 */
export const CvLocationFields = ({
  variant = "subtle",
  size = "sm",
}: TCvLocationFieldsProps) => {
  const { control, setValue } = useFormContext<TCvData>();
  const countryField = useController({
    control,
    name: COUNTRY,
    rules: {
      validate: (value) => Boolean(value?.trim()) || "Country is required",
    },
  });
  const stateName = useWatch({ control, name: STATE });
  const cityName = useWatch({ control, name: CITY });

  const [countries, setCountries] = useState<TCountry[]>([]);
  const [statesResult, setStatesResult] = useState<TStatesResult>();
  const [citySearch, setCitySearch] = useState<TCitySearch>();

  const country = countries.find(
    ({ name }) => name === countryField.field.value,
  );
  // Only the states fetched for the country picked now.
  const states =
    country && statesResult?.countryCode === country.code
      ? statesResult.states
      : undefined;
  const state = states?.find(({ name }) => name === stateName);

  const setField = (name: typeof STATE | typeof CITY, value: string) =>
    setValue(name, value, { shouldDirty: true });

  const setCountry = (name: string) => {
    if (name === countryField.field.value) return;
    countryField.field.onChange(name);
    countryField.field.onBlur();
    setField(STATE, "");
    setField(CITY, "");
  };

  const setState = (name: string) => {
    if (name === stateName) return;
    setField(STATE, name);
    setField(CITY, "");
  };

  const setCity = (city: TCity | undefined) => {
    setField(CITY, city?.name ?? "");
    // Picking a city first fills in its state.
    if (city?.state && !stateName) setField(STATE, city.state.name);
  };

  const countryText = useFieldText(countryField.field.value ?? "", () =>
    setCountry(""),
  );
  const stateText = useFieldText(stateName ?? "", () => setState(""));
  const cityText = useFieldText(cityName ?? "", () => setCity(undefined));
  const cityQuery = cityText.query;
  const cityKey = `${country?.code}|${state?.id}|${cityQuery.trim()}`;
  const cities = citySearch?.key === cityKey ? citySearch.cities : [];

  useEffect(() => {
    locationsApi.countries().then(setCountries, () => {
      // The fields stay empty; picking a country will be impossible until
      // the API is back, but typing the rest of the CV still works.
    });
  }, []);

  useEffect(() => {
    if (!country) return;
    let active = true;
    locationsApi.states(country.code).then(
      (list) =>
        active && setStatesResult({ countryCode: country.code, states: list }),
      () =>
        active && setStatesResult({ countryCode: country.code, states: [] }),
    );
    return () => {
      active = false;
    };
  }, [country]);

  // Searches as the user types (biggest cities first when empty).
  useEffect(() => {
    if (!country) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      locationsApi
        .cities(
          { country: country.code, state: state?.id, search: cityQuery.trim() },
          controller.signal,
        )
        .then(
          (list) => setCitySearch({ key: cityKey, cities: list }),
          () => {
            // Aborted or failed; the previous results stay hidden.
          },
        );
    }, CITY_SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [country, state, cityQuery, cityKey]);

  // The picked city as an option, so the field can show it.
  const cityValue = useMemo<TCity | undefined>(
    () => (cityName ? { id: 0, name: cityName, state: null } : undefined),
    [cityName],
  );

  return (
    <>
      <GridCell>
        <AutoComplete<TCountry>
          ref={noAutofill}
          label="Country"
          placeholder="Search countries"
          variant={variant}
          size={size}
          required
          options={countries}
          filterOptions={filterWhileTyping(countryText.typing)}
          getOptionLabel={({ name }) => name}
          getOptionKey={({ code }) => code}
          value={country}
          {...countryText.inputProps}
          onChange={(_, value) => {
            countryText.reset();
            // `undefined` is the picked option clicked again; keep it.
            if (value) setCountry((value as TCountry).name);
          }}
          error={Boolean(countryField.fieldState.error)}
          helperText={countryField.fieldState.error?.message}
        />
      </GridCell>
      <GridCell>
        <AutoComplete<TState>
          ref={noAutofill}
          label="State"
          placeholder={
            states && states.length === 0 ? "No states" : "Search states"
          }
          variant={variant}
          size={size}
          disabled={!states?.length}
          options={states ?? []}
          filterOptions={filterWhileTyping(stateText.typing)}
          getOptionLabel={({ name }) => name}
          getOptionKey={({ id }) => String(id)}
          value={state}
          {...stateText.inputProps}
          onChange={(_, value) => {
            stateText.reset();
            if (value) setState((value as TState).name);
          }}
        />
      </GridCell>
      <GridCell>
        <AutoComplete<TCity>
          ref={noAutofill}
          label="City"
          placeholder={country ? "Search cities" : "Pick a country first"}
          variant={variant}
          size={size}
          disabled={!country}
          options={cities}
          filterOptions={keepAll}
          getOptionLabel={cityLabel}
          getOptionKey={({ id }) => String(id)}
          isValueEqual={(a, b) => a.name === b.name}
          value={cityValue}
          {...cityText.inputProps}
          onChange={(_, value) => {
            cityText.reset();
            if (value) setCity(value as TCity);
          }}
        />
      </GridCell>
      <GridCell>
        <CvTextField
          name="personalInformation.zip"
          label="Zip"
          variant={variant}
          size={size}
        />
      </GridCell>
    </>
  );
};

export default CvLocationFields;
