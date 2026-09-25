"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Grid, GridCell, Link, Text } from "@costor/ui";
import { useForm } from "react-hook-form";
import AuthForm from "@/components/auth-form";
import FormTextField from "@/components/form-text-field";
import { authApi } from "@/utils/auth-api";
import { emailRules, newPasswordRules } from "@/utils/auth-rules";
import type { TSignUpValues } from "@/views/sign-up-page/types";

const SignUpPage = () => {
  const router = useRouter();
  const form = useForm<TSignUpValues>({
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  const onSubmit = async (values: TSignUpValues) => {
    await authApi.signUp(values);
    // Signed in already; ask them to confirm their email next.
    router.replace("/auth/verify-account");
  };

  return (
    <AuthForm
      title="Create an account"
      form={form}
      onSubmit={onSubmit}
      submitLabel="Sign up"
      footer={
        <Text size="sm">
          Already have an account?{" "}
          <Link as={NextLink} href="/auth/sign-in">
            Sign in
          </Link>
        </Text>
      }
    >
      <Grid columns={2} gap={4}>
        <GridCell>
          <FormTextField<TSignUpValues>
            name="firstName"
            label="First name"
            autoComplete="given-name"
            rules={{ required: "First name is required" }}
            required
          />
        </GridCell>
        <GridCell>
          <FormTextField<TSignUpValues>
            name="lastName"
            label="Last name"
            autoComplete="family-name"
            rules={{ required: "Last name is required" }}
            required
          />
        </GridCell>
      </Grid>
      <FormTextField<TSignUpValues>
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        rules={emailRules}
        required
      />
      <FormTextField<TSignUpValues>
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        helperText="At least 8 characters"
        rules={newPasswordRules}
        required
      />
    </AuthForm>
  );
};

export default SignUpPage;
