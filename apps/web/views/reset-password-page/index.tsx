"use client";

import { useState } from "react";
import NextLink from "next/link";
import { Link } from "@costor/ui";
import { useForm } from "react-hook-form";
import AuthForm from "@/components/auth-form";
import AuthMessage from "@/components/auth-message";
import FormTextField from "@/components/form-text-field";
import { authApi } from "@/utils/auth-api";
import { newPasswordRules } from "@/utils/auth-rules";
import type {
  TResetPasswordPageProps,
  TResetPasswordValues,
} from "@/views/reset-password-page/types";

const ResetPasswordPage = ({ token }: TResetPasswordPageProps) => {
  const [done, setDone] = useState(false);
  const form = useForm<TResetPasswordValues>({
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <AuthMessage
        title="Invalid link"
        footer={
          <Link as={NextLink} href="/auth/forgot-password">
            Request a new link
          </Link>
        }
      >
        This password reset link is missing its token.
      </AuthMessage>
    );
  }

  if (done) {
    return (
      <AuthMessage
        title="Password changed"
        footer={
          <Link as={NextLink} href="/auth/sign-in">
            Sign in
          </Link>
        }
      >
        Your password was changed and you were signed out everywhere. Sign in
        with your new password.
      </AuthMessage>
    );
  }

  const onSubmit = async ({ password }: TResetPasswordValues) => {
    await authApi.resetPassword({ token, password });
    setDone(true);
  };

  return (
    <AuthForm
      title="Set a new password"
      form={form}
      onSubmit={onSubmit}
      submitLabel="Change password"
      footer={
        <Link as={NextLink} href="/auth/forgot-password">
          Link expired? Request a new one
        </Link>
      }
    >
      <FormTextField<TResetPasswordValues>
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        helperText="At least 8 characters"
        rules={newPasswordRules}
        required
      />
      <FormTextField<TResetPasswordValues>
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        rules={{
          validate: (value, { password }) =>
            value === password || "Passwords don't match",
        }}
        required
      />
    </AuthForm>
  );
};

export default ResetPasswordPage;
