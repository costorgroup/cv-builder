export type TCurrencyPickerProps = {
  /** The currency prices are shown in now. */
  currency: string;
  /** The currencies there are prices in. */
  currencies: string[];
  /** Called once the choice is saved, e.g. to load the prices again. */
  onChange?: (currency: string) => void;
};
