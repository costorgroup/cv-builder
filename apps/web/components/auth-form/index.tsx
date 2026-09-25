"use client";

import { useState } from "react";
import { Alert, Button, Heading, Text } from "@costor/ui";
import { FormProvider } from "react-hook-form";
import type { FieldValues } from "react-hook-form";
import { SAuthForm, SAuthFormFooter } from "@/components/auth-form/styles";
import type { TAuthFormProps } from "@/components/auth-form/types";
import { ApiError } from "@/utils/auth-api";

/** Title, fields, submit button and API error for the auth pages. */
export const AuthForm = <TValues extends FieldValues>({
  title,
  description,
  form,
  onSubmit,
  submitLabel,
  footer,
  children,
}: TAuthFormProps<TValues>) => {
  const [error, setError] = useState<string>();

  const submit = form.handleSubmit(async (values) => {
    setError(undefined);
    try {
      await onSubmit(values);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Couldn't reach the server. Try again.",
      );
    }
  });

  return (
    <FormProvider {...form}>
      <SAuthForm onSubmit={submit} noValidate>
        <Heading as="h1">{title}</Heading>
        {description && <Text>{description}</Text>}
        {error && (
          <Alert color="error" variant="subtle">
            {error}
          </Alert>
        )}
        {children}
        <Button
          type="submit"
          variant="solid"
          color="primary"
          fullWidth
          disabled={form.formState.isSubmitting}
        >
          {submitLabel}
        </Button>
        {footer && (
          <SAuthFormFooter direction="column" gap={2}>
            {footer}
          </SAuthFormFooter>
        )}
      </SAuthForm>
    </FormProvider>
  );
};

export default AuthForm;
