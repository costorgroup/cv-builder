"use client";

import { CheckBox, Flex, Small, Strong, TextField } from "@costor/ui";
import { FEATURES, LIMITS } from "@repo/cv-core";
import {
  SEntitlementsEditorGrid,
  SEntitlementsEditorLimit,
} from "@/components/entitlements-editor/styles";
import type {
  TEntitlementsDraft,
  TEntitlementsEditorProps,
} from "@/components/entitlements-editor/types";
import { FEATURE_LABELS, LIMIT_LABELS } from "@/utils/plan-features";

/**
 * Picks features and sets limits, for a plan or one account's extras. Every
 * feature and limit the app knows is listed; nothing else can be typed in.
 */
export const EntitlementsEditor = ({
  value,
  onChange,
  disabled,
  emptyLimitHint,
}: TEntitlementsEditorProps) => {
  const setLimit = (limit: string, next: number | null | undefined) =>
    onChange({ ...value, limits: { ...value.limits, [limit]: next } });

  return (
    <Flex direction="column" gap={6}>
      <Flex direction="column" gap={3}>
        <Strong>Features</Strong>
        <SEntitlementsEditorGrid>
          {FEATURES.map((feature) => (
            <CheckBox
              key={feature}
              size="sm"
              label={FEATURE_LABELS[feature]}
              disabled={disabled}
              checked={value.features.includes(feature)}
              onChange={(event) =>
                onChange({
                  ...value,
                  features: event.target.checked
                    ? [...value.features, feature]
                    : value.features.filter((each) => each !== feature),
                })
              }
            />
          ))}
        </SEntitlementsEditorGrid>
      </Flex>
      <Flex direction="column" gap={3}>
        <Flex direction="column" gap={0.5}>
          <Strong>Limits</Strong>
          <Small color="secondary">Empty means {emptyLimitHint}.</Small>
        </Flex>
        <SEntitlementsEditorGrid>
          {LIMITS.map((limit) => {
            const current = value.limits[limit];
            return (
              <SEntitlementsEditorLimit key={limit}>
                <Small>{LIMIT_LABELS[limit]}</Small>
                <TextField
                  aria-label={LIMIT_LABELS[limit]}
                  type="number"
                  size="sm"
                  variant="subtle"
                  inputMode="numeric"
                  placeholder={current === null ? "∞" : emptyLimitHint}
                  disabled={disabled || current === null}
                  value={typeof current === "number" ? String(current) : ""}
                  onChange={(event) => {
                    const text = event.target.value.trim();
                    const number = Number(text);
                    setLimit(
                      limit,
                      text === ""
                        ? undefined
                        : Number.isInteger(number) && number >= 0
                          ? number
                          : current,
                    );
                  }}
                />
                <CheckBox
                  size="sm"
                  label="Unlimited"
                  disabled={disabled}
                  checked={current === null}
                  onChange={(event) =>
                    setLimit(limit, event.target.checked ? null : undefined)
                  }
                />
              </SEntitlementsEditorLimit>
            );
          })}
        </SEntitlementsEditorGrid>
      </Flex>
    </Flex>
  );
};

export default EntitlementsEditor;

/** The draft as the API takes it: limits left empty aren't sent. */
export const toEntitlementValues = ({
  features,
  limits,
}: TEntitlementsDraft) => ({
  features,
  limits: Object.fromEntries(
    Object.entries(limits).filter(([, limit]) => limit !== undefined),
  ) as Record<string, number | null>,
});
