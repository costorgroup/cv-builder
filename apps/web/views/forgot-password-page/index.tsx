"use client";

import { useState } from "react";
import NextLink from "next/link";
import { Link } from "@costor/ui";
import { useForm } from "react-hook-form";
import AuthForm from "@/components/auth-form";
import AuthMessage from "@/components/auth-message";
import FormTextField from "@/components/form-text-field";
import { authApi } from "@/utils/auth-api";
import { emailRules } from "@/utils/auth-rules";
import type { TForgotPasswordValues } from "@/views/forgot-password-page/types";

const backToSignIn = (
  <Link as={NextLink} href="/auth/sign-in">
    Back to sign in
  </Link>
);

const ForgotPasswordPage = () => {
  const [sentTo, setSentTo] = useState<string>();
  const form = useForm<TForgotPasswordValues>({
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: TForgotPasswordValues) => {
    await authApi.forgotPassword(email);
    setSentTo(email);
  };

  if (sentTo) {
    return (
      <AuthMessage title="Check your email" footer={backToSignIn}>
        If an account exists for {sentTo}, we sent a link to reset your
        password. It works for one hour.
      </AuthMessage>
    );
  }

  return (
    <AuthForm
      title="Forgot your password?"
      description="Enter your email and we'll send you a link to reset it."
      form={form}
      onSubmit={onSubmit}
      submitLabel="Send reset link"
      footer={backToSignIn}
    >
      <FormTextField<TForgotPasswordValues>
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        rules={emailRules}
        required
      />
    </AuthForm>
  );
};

export default ForgotPasswordPage;
