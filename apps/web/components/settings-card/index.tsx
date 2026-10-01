"use client";

import { useState } from "react";
import { Alert, Button, Heading, Small } from "@costor/ui";
import { FormProvider, type FieldValues } from "react-hook-form";
import {
  SSettingsCard,
  SSettingsCardActions,
  SSettingsCardFields,
  SSettingsCardHeader,
} from "@/components/settings-card/styles";
import type {
  TSettingsCardProps,
  TSettingsFormProps,
} from "@/components/settings-card/types";
import { ApiError } from "@/utils/api-client";

/** One group of settings on an account page. */
export const SettingsCard = ({
  title,
  description,
  children,
  actions,
  danger,
}: TSettingsCardProps) => (
  <SSettingsCard radius="lg">
    <SSettingsCardHeader direction="column" gap={1}>
      <Heading as="h6" color={danger ? "error" : undefined}>
        {title}
      </Heading>
      {description && <Small color="secondary">{description}</Small>}
    </SSettingsCardHeader>
    {children}
    {actions && (
      <SSettingsCardActions gap={2} wrap="wrap">
        {actions}
      </SSettingsCardActions>
    )}
  </SSettingsCard>
);

/**
 * A settings card holding a form: fields, a save button, and the API's error
 * or a success message.
 */
export const SettingsForm = <TValues extends FieldValues>({
  form,
  onSubmit,
  submitLabel,
  requireChanges,
  clearOnSuccess,
  children,
  ...card
}: TSettingsFormProps<TValues>) => {
  const [status, setStatus] = useState<
    { error: string } | { success: string } | undefined
  >();
  const { isSubmitting, isDirty } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    setStatus(undefined);
    try {
      const message = await onSubmit(values);
      // What was saved is the new starting point for "has it changed".
      form.reset(clearOnSuccess ? undefined : values);
      if (message) setStatus({ success: message });
    } catch (caught) {
      setStatus({
        error:
          caught instanceof ApiError
            ? caught.message
            : "Couldn't reach the server. Try again.",
      });
    }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate>
        <SettingsCard
          {...card}
          actions={
            <Button
              type="submit"
              variant="solid"
              color="primary"
              disabled={isSubmitting || (requireChanges && !isDirty)}
            >
              {submitLabel}
            </Button>
          }
        >
          <SSettingsCardFields direction="column" gap={4}>
            {status && (
              <Alert
                color={"error" in status ? "error" : "success"}
                variant="subtle"
                size="sm"
              >
                {"error" in status ? status.error : status.success}
              </Alert>
            )}
            {children}
          </SSettingsCardFields>
        </SettingsCard>
      </form>
    </FormProvider>
  );
};

export default SettingsCard;
