export type TPremiumBadgeProps = {
  /** Just the lock, for tight spots like color swatches. */
  iconOnly?: boolean;
  className?: string;
};

export type TSPremiumBadgeProps = Pick<TPremiumBadgeProps, "iconOnly">;
