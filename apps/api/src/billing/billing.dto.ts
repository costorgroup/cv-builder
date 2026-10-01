import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

const PERIODS = ["MONTHLY", "QUARTERLY", "YEARLY"] as const;

/** Which organization a billing action is for: a team, or the user's own. */
export class BillingTargetDto {
  /** A team the user owns; left out for their own account. */
  @IsOptional()
  @IsUUID()
  teamId?: string;
}

/** A plan and billing period to buy or switch to. */
export class PlanChoiceDto extends BillingTargetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  planKey: string;

  @IsIn(PERIODS, { message: "period must be MONTHLY, QUARTERLY or YEARLY" })
  period: (typeof PERIODS)[number];
}
