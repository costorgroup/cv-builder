import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Shared rule for every new password. */
const NewPassword = () =>
  applyDecorators(
    IsString(),
    MinLength(8, { message: 'Password must be at least 8 characters' }),
    MaxLength(128),
  );

export class SignUpDto {
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

  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Enter a valid email' })
  email: string;

  @NewPassword()
  password: string;
}

export class SignInDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Enter a valid email' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MaxLength(128)
  password: string;
}

export class ForgotPasswordDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Enter a valid email' })
  email: string;
}

export class TokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  token: string;
}

export class ResetPasswordDto extends TokenDto {
  @NewPassword()
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  @MaxLength(128)
  currentPassword: string;

  @NewPassword()
  newPassword: string;
}
