"use client";

import { Alert, Button } from "@costor/ui";
import ButtonLink from "@/components/button-link";
import { SUpgradePromptIcon } from "@/components/upgrade-prompt/styles";
import { LockIcon } from "@/layouts/dashboard-layout/icons";
import { useCvEditorEnv } from "@/providers/cv-editor-env";
import type { TUpgradePromptProps } from "@/components/upgrade-prompt/types";
import { planRestrictionText } from "@/utils/plan-restriction";
import { PRICING_PATH } from "@/utils/site";

/**
 * Says what the plan doesn't allow and what to do about it, with a way to
 * see the plans. The one message for every limit and locked feature.
 */
export const UpgradePrompt = ({
  restriction,
  action,
  href = PRICING_PATH,
  className,
  wide = false,
}: TUpgradePromptProps) => {
  const { title, description } = planRestrictionText(restriction);
  // In an embed, the person can't upgrade: there's nowhere to send them.
  const { showUpgrades = true } = useCvEditorEnv();
  return (
    <Alert
      className={className}
      color="warning"
      variant="subtle"
      size="sm"
      title={title}
      icon={
        wide ? (
          <SUpgradePromptIcon>
            <LockIcon />
          </SUpgradePromptIcon>
        ) : undefined
      }
      iconAlign={wide ? "center" : undefined}
      actionsPlacement={wide ? "end" : undefined}
      actions={
        <>
          {action}
          {showUpgrades && (
            <Button
              as={ButtonLink}
              href={href}
              size="sm"
              variant="solid"
              color="warning"
            >
              See plans
            </Button>
          )}
        </>
      }
    >
      {description}
    </Alert>
  );
};

export default UpgradePrompt;
