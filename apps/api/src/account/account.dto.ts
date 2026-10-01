import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** The same rules as signing up. */
export class UpdateProfileDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(100)
  firstName: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(100)
  lastName: string;
}

/** Deleting the account asks for the password again. */
export class DeleteAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MaxLength(128)
  password: string;
}
