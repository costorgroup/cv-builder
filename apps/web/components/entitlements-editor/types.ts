/**
 * Features and limits as edited. A limit is a maximum, null for unlimited,
 * or undefined for "not set" (0 on a plan; the plan's own on an account).
 */
export type TEntitlementsDraft = {
  features: string[];
  limits: Record<string, number | null | undefined>;
};

export type TEntitlementsEditorProps = {
  value: TEntitlementsDraft;
  onChange: (value: TEntitlementsDraft) => void;
  disabled?: boolean;
  /** What an empty limit means, shown as its placeholder. */
  emptyLimitHint: string;
};
