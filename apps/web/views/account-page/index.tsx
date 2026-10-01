"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Chip,
  Flex,
  Modal,
  Skeleton,
  Strong,
  TextField,
} from "@costor/ui";
import { useForm } from "react-hook-form";
import FormTextField from "@/components/form-text-field";
import SettingsCard, { SettingsForm } from "@/components/settings-card";
import { useAuth } from "@/providers/auth-provider";
import { accountApi } from "@/utils/account-api";
import { ApiError, authApi, type TAuthUser } from "@/utils/auth-api";
import { SAccountPage } from "@/views/account-page/styles";
import type {
  TDeleteAccountModalProps,
  TProfileValues,
} from "@/views/account-page/types";

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Couldn't reach the server. Try again.";

const ProfileForm = ({ user }: { user: TAuthUser }) => {
  const { reload } = useAuth();
  const form = useForm<TProfileValues>({
    defaultValues: { firstName: user.firstName, lastName: user.lastName },
  });

  return (
    <SettingsForm
      title="Profile"
      description="Your name as it shows in CV Builder. Your CVs keep the name you gave them."
      form={form}
      onSubmit={async (values) => {
        await accountApi.updateProfile(values);
        await reload();
        return "Saved.";
      }}
      submitLabel="Save"
      requireChanges
    >
      <FormTextField<TProfileValues>
        name="firstName"
        label="First name"
        autoComplete="given-name"
        rules={{ required: "First name is required" }}
        required
      />
      <FormTextField<TProfileValues>
        name="lastName"
        label="Last name"
        autoComplete="family-name"
        rules={{ required: "Last name is required" }}
        required
      />
    </SettingsForm>
  );
};

const EmailCard = ({ user }: { user: TAuthUser }) => {
  const [resend, setResend] = useState<
    "idle" | "sending" | "sent" | { error: string }
  >("idle");

  const onResend = async () => {
    setResend("sending");
    try {
      await authApi.resendVerification();
      setResend("sent");
    } catch (error) {
      setResend({ error: messageOf(error) });
    }
  };

  return (
    <SettingsCard
      title="Email"
      description="Where we send sign-in links and account emails."
      actions={
        !user.emailVerified && (
          <Button
            disabled={resend === "sending" || resend === "sent"}
            onClick={onResend}
          >
            {resend === "sent" ? "Email sent" : "Send verification email"}
          </Button>
        )
      }
    >
      <Flex align="center" gap={2} wrap="wrap">
        <Strong>{user.email}</Strong>
        <Chip
          radius="pill"
          size="xs"
          variant="subtle"
          color={user.emailVerified ? "success" : "warning"}
        >
          {user.emailVerified ? "Verified" : "Not verified"}
        </Chip>
      </Flex>
      {typeof resend === "object" && (
        <Alert color="error" variant="subtle" size="sm">
          {resend.error}
        </Alert>
      )}
    </SettingsCard>
  );
};

const DeleteAccountModal = ({ open, onClose }: TDeleteAccountModalProps) => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();

  const onDelete = async () => {
    setDeleting(true);
    setError(undefined);
    try {
      await accountApi.deleteAccount(password);
    } catch (deleteError) {
      setError(messageOf(deleteError));
      setDeleting(false);
      return;
    }
    // The API signed this browser out along with deleting the account.
    router.replace("/");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete your account?"
      size="sm"
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="solid"
            color="error"
            disabled={deleting || !password}
            onClick={onDelete}
          >
            {deleting ? "Deleting…" : "Delete account"}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (password) void onDelete();
        }}
      >
        <Flex direction="column" gap={4}>
          <Alert color="error" variant="subtle" size="sm">
            Your account and every CV in it will be deleted for good. This
            can&apos;t be undone.
          </Alert>
          <TextField
            label="Password"
            type="password"
            variant="subtle"
            size="sm"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            helperText={error ?? "Enter your password to confirm."}
            error={!!error}
          />
        </Flex>
      </form>
    </Modal>
  );
};

/** The signed-in user's profile, email, and deleting the account. */
const AccountPage = () => {
  const auth = useAuth();
  const [deleting, setDeleting] = useState(false);

  if (auth.status !== "signed-in") {
    return (
      <SAccountPage direction="column" gap={5} aria-busy>
        <Skeleton width="100%" height={260} radius="lg" />
        <Skeleton width="100%" height={140} radius="lg" />
      </SAccountPage>
    );
  }

  const { user } = auth;
  return (
    <SAccountPage direction="column" gap={5}>
      <ProfileForm key={user.id} user={user} />
      <EmailCard user={user} />
      <SettingsCard
        title="Delete account"
        description="Deletes your account and all your CVs. This can't be undone."
        danger
        actions={
          <Button color="error" onClick={() => setDeleting(true)}>
            Delete account
          </Button>
        }
      />
      <DeleteAccountModal
        // Remounted when opened, so the password field starts empty.
        key={String(deleting)}
        open={deleting}
        onClose={() => setDeleting(false)}
      />
    </SAccountPage>
  );
};

export default AccountPage;
