"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import {
  Alert,
  Button,
  Chip,
  Flex,
  Link,
  Skeleton,
  Small,
  Strong,
} from "@costor/ui";
import { useForm } from "react-hook-form";
import FormTextField from "@/components/form-text-field";
import SettingsCard, { SettingsForm } from "@/components/settings-card";
import { useAuth } from "@/providers/auth-provider";
import { accountApi, type TAccountSession } from "@/utils/account-api";
import { ApiError, authApi } from "@/utils/auth-api";
import { newPasswordRules, passwordRules } from "@/utils/auth-rules";
import { describeDevice } from "@/utils/describe-device";
import {
  SSecurityPage,
  SSecurityPageSession,
  SSecurityPageSessionText,
} from "@/views/security-page/styles";
import type {
  TChangePasswordFormProps,
  TChangePasswordValues,
  TSessionsCardProps,
} from "@/views/security-page/types";

const EMPTY_PASSWORDS: TChangePasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const lastUsed = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Couldn't reach the server. Try again.";

const ChangePasswordForm = ({ onChanged }: TChangePasswordFormProps) => {
  const form = useForm<TChangePasswordValues>({
    defaultValues: EMPTY_PASSWORDS,
  });

  return (
    <SettingsForm
      title="Password"
      description={
        <>
          Changing it signs out your other devices.{" "}
          <Link
            as={NextLink}
            href="/auth/forgot-password"
            // Sized like the description it sits in.
            style={{ fontSize: "inherit" }}
          >
            Forgot your current password?
          </Link>
        </>
      }
      form={form}
      onSubmit={async ({ currentPassword, newPassword }) => {
        await authApi.changePassword({ currentPassword, newPassword });
        onChanged();
        return "Password changed. Your other devices were signed out.";
      }}
      submitLabel="Change password"
      clearOnSuccess
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
    </SettingsForm>
  );
};

const SessionsCard = ({ version }: TSessionsCardProps) => {
  const [sessions, setSessions] = useState<TAccountSession[]>();
  const [error, setError] = useState<string>();
  // Bumped after signing devices out, to show what's left.
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    accountApi.sessions(controller.signal).then(
      (list) => {
        setSessions(list);
        setError(undefined);
      },
      (loadError: unknown) =>
        !controller.signal.aborted && setError(messageOf(loadError)),
    );
    return () => controller.abort();
  }, [version, attempt]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(undefined);
    try {
      await action();
      setAttempt((count) => count + 1);
    } catch (actionError) {
      setError(messageOf(actionError));
    } finally {
      setBusy(false);
    }
  };

  const others = sessions?.filter(({ current }) => !current) ?? [];

  return (
    <SettingsCard
      title="Signed-in devices"
      description="Where your account is signed in. Sign out any device you don't recognize, then change your password."
      actions={
        others.length > 0 && (
          <Button
            disabled={busy}
            onClick={() => run(accountApi.signOutOtherSessions)}
          >
            Sign out all other devices
          </Button>
        )
      }
    >
      {error && (
        <Alert color="error" variant="subtle" size="sm">
          {error}
        </Alert>
      )}
      {!sessions ? (
        !error && <Skeleton width="100%" height={120} />
      ) : (
        <Flex direction="column">
          {sessions.map((session) => (
            <SSecurityPageSession
              key={session.id}
              align="center"
              gap={3}
              wrap="wrap"
            >
              <SSecurityPageSessionText direction="column" gap={0.5}>
                <Flex align="center" gap={2} wrap="wrap">
                  <Strong>{describeDevice(session.userAgent)}</Strong>
                  {session.current && (
                    <Chip
                      radius="pill"
                      size="xs"
                      variant="subtle"
                      color="success"
                    >
                      This device
                    </Chip>
                  )}
                </Flex>
                <Small color="secondary">
                  {[
                    session.ipAddress,
                    `Last active ${lastUsed.format(new Date(session.lastUsedAt))}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Small>
              </SSecurityPageSessionText>
              {!session.current && (
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    run(() => accountApi.revokeSession(session.id))
                  }
                >
                  Sign out
                </Button>
              )}
            </SSecurityPageSession>
          ))}
        </Flex>
      )}
    </SettingsCard>
  );
};

/** Password, and the devices signed in to the account. */
const SecurityPage = () => {
  const auth = useAuth();
  // Bumped after a password change, which signs other devices out.
  const [version, setVersion] = useState(0);

  if (auth.status !== "signed-in") {
    return (
      <SSecurityPage direction="column" gap={5} aria-busy>
        <Skeleton width="100%" height={360} radius="lg" />
        <Skeleton width="100%" height={200} radius="lg" />
      </SSecurityPage>
    );
  }

  return (
    <SSecurityPage direction="column" gap={5}>
      <ChangePasswordForm onChanged={() => setVersion((count) => count + 1)} />
      <SessionsCard version={version} />
    </SSecurityPage>
  );
};

export default SecurityPage;
