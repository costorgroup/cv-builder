import { Transform } from 'class-transformer';
import { IsOptional, Matches } from 'class-validator';

const upperCase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class ListPlansQuery {
  /** Show prices in this currency, e.g. "USD", if there are any in it. */
  @IsOptional()
  @Transform(upperCase)
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter code' })
  currency?: string;

  /** Show prices in this country's currency, e.g. "RS". */
  @IsOptional()
  @Transform(upperCase)
  @Matches(/^[A-Z]{2}$/, { message: 'country must be a 2-letter code' })
  country?: string;
}
