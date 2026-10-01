import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { OrganizationRole } from '../generated/prisma/client.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class TeamNameDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;
}

export class InviteDto {
  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsIn([OrganizationRole.ADMIN, OrganizationRole.MEMBER])
  role: OrganizationRole;
}

export class MemberRoleDto {
  @IsIn([OrganizationRole.ADMIN, OrganizationRole.MEMBER])
  role: OrganizationRole;
}

export class TransferOwnershipDto {
  @IsString()
  userId: string;
}
