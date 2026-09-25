"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Link, Text } from "@costor/ui";
import { useForm } from "react-hook-form";
import AuthForm from "@/components/auth-form";
import FormTextField from "@/components/form-text-field";
import { authApi, safeRedirectPath } from "@/utils/auth-api";
import { emailRules, passwordRules } from "@/utils/auth-rules";
import type { TSignInPageProps, TSignInValues } from "@/views/sign-in-page/types";

const SignInPage = ({ next }: TSignInPageProps) => {
  const router = useRouter();
  const form = useForm<TSignInValues>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: TSignInValues) => {
    await authApi.signIn(values);
    router.replace(safeRedirectPath(next));
    router.refresh();
  };

  return (
    <AuthForm
      title="Sign in"
      form={form}
      onSubmit={onSubmit}
      submitLabel="Sign in"
      footer={
        <>
          <Link as={NextLink} href="/auth/forgot-password">
            Forgot your password?
          </Link>
          <Text size="sm">
            No account yet?{" "}
            <Link as={NextLink} href="/auth/sign-up">
              Sign up
            </Link>
          </Text>
        </>
      }
    >
      <FormTextField<TSignInValues>
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        rules={emailRules}
        required
      />
      <FormTextField<TSignInValues>
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        rules={passwordRules}
        required
      />
    </AuthForm>
  );
};

export default SignInPage;
