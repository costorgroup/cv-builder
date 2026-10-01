"use client";

import { useRouter } from "next/navigation";
import { NativeSelect } from "@costor/ui";
import { CURRENCY_COOKIE } from "@repo/cv-core";
import { SCurrencyPicker } from "@/components/currency-picker/styles";
import type { TCurrencyPickerProps } from "@/components/currency-picker/types";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Picks which currency prices are shown in. The choice is kept in a cookie,
 * which the API reads, so it sticks across pages and visits.
 */
export const CurrencyPicker = ({
  currency,
  currencies,
  onChange,
}: TCurrencyPickerProps) => {
  const router = useRouter();

  // Nothing to choose between.
  if (currencies.length < 2) return null;

  return (
    <SCurrencyPicker>
      <NativeSelect
        aria-label="Currency"
        size="sm"
        variant="subtle"
        value={currency}
        options={currencies}
        onChange={(_, next) => {
          document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
          // Server-rendered prices are fetched again with the new cookie.
          router.refresh();
          onChange?.(next);
        }}
      />
    </SCurrencyPicker>
  );
};

export default CurrencyPicker;
