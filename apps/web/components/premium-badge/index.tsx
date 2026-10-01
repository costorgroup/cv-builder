import { LockIcon } from "@/components/premium-badge/icons";
import { SPremiumBadge } from "@/components/premium-badge/styles";
import type { TPremiumBadgeProps } from "@/components/premium-badge/types";

/**
 * Marks an option the plan doesn't include. It can still be tried out in
 * the preview; saving explains the upgrade.
 */
export const PremiumBadge = ({ iconOnly, className }: TPremiumBadgeProps) => (
  <SPremiumBadge
    className={className}
    size="xs"
    variant="solid"
    color="warning"
    radius="pill"
    iconOnly={iconOnly}
    title="Part of Premium"
    aria-label="Part of Premium"
  >
    <LockIcon />
    {!iconOnly && "Premium"}
  </SPremiumBadge>
);

export default PremiumBadge;
