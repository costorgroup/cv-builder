"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Link } from "@costor/ui";
import { useForm } from "react-hook-form";
import AuthForm from "@/components/auth-form";
import AuthMessage from "@/components/auth-message";
import FormTextField from "@/components/form-text-field";
import { ApiError, authApi } from "@/utils/auth-api";
import { newPasswordRules, passwordRules } from "@/utils/auth-rules";
import { signInPath } from "@/utils/auth-routes";
import type { TChangePasswordValues } from "@/views/change-password-page/types";

const SIGN_IN_PATH = signInPath("/auth/change-password");

const isSignedOut = (error: unknown) =>
  error instanceof ApiError && error.status === 401;

const ChangePasswordPage = () => {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const form = useForm<TChangePasswordValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Signed-in only; send anyone else to sign in and back.
  useEffect(() => {
    authApi.me().catch((error: unknown) => {
      if (isSignedOut(error)) router.replace(SIGN_IN_PATH);
    });
  }, [router]);

  const onSubmit = async ({
    currentPassword,
    newPassword,
  }: TChangePasswordValues) => {
    try {
      await authApi.changePassword({ currentPassword, newPassword });
    } catch (error) {
      if (isSignedOut(error)) return router.replace(SIGN_IN_PATH);
      throw error;
    }
    setDone(true);
  };

  if (done) {
    return (
      <AuthMessage
        title="Password changed"
        footer={
          <Link as={NextLink} href="/dashboard">
            Continue
          </Link>
        }
      >
        Your other devices were signed out.
      </AuthMessage>
    );
  }

  return (
    <AuthForm
      title="Change password"
      form={form}
      onSubmit={onSubmit}
      submitLabel="Change password"
      footer={
        <Link as={NextLink} href="/auth/forgot-password">
          Forgot your current password?
        </Link>
      }
    >
      <FormTextField<TChangePasswordValues>
        name="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
        rules={passwordRules}
        required
      />
      <FormTextField<TChangePasswordValues>
        name="newPassword"
        label="New password"
        type="password"
        autoComplete="new-password"
        helperText="At least 8 characters"
        rules={newPasswordRules}
        required
      />
      <FormTextField<TChangePasswordValues>
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        rules={{
          validate: (value, { newPassword }) =>
            value === newPassword || "Passwords don't match",
        }}
        required
      />
    </AuthForm>
  );
};

export default ChangePasswordPage;
